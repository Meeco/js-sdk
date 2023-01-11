import { Item, ItemApi, ItemsResponse, Share } from '@meeco/vault-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import DecryptedKeypair from '../models/decrypted-keypair';
import { ItemUpdate } from '../models/item-update';
import { NewItem } from '../models/new-item';
import { SymmetricKey } from '../models/symmetric-key';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import SlotHelpers from '../util/slot-helpers';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

/**
 * Filter Item list with following params
 * @param templateIds array of item template ids
 * @param scheme name of item scheme
 * @param classifications array of item classification names e.g. pets, vehicle
 * @param sharedWith user Id. item shared with provided user id.
 * Works for items owned by the current user as well as for items owned by someone else and on-shared by the current user.
 * @param ownerId only return Items created by the given user id.
 * @param own only return Items you created.
 * @param name name of item.
 */
export interface IItemListFilterOptions {
  templateIds?: string[];
  scheme?: string;
  classifications?: string[];
  sharedWith?: string;
  ownerId?: string;
  own?: boolean;
  itemIds?: string[];
  name?: string;
}

/** DecryptedItems together with response metadata if needed for paging etc. */
export type DecryptedItems = Pick<ItemsResponse, 'meta' | 'next_page_after'> & {
  items: DecryptedItem[];
};

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService extends Service<ItemApi> {
  /**
   * True if the Item was received via a Share from another user.
   * In that case, it must be decrypted with the Share DEK, not the user's own DEK.
   */
  public static itemIsFromShare(item: Item): boolean {
    return item.own === false || !!item.share_id;
  }

  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).ItemApi;
  }

  public async create(credentials: IVaultToken & IDEK, item: NewItem): Promise<DecryptedItem> {
    const { data_encryption_key } = credentials;
    const request = await item.toRequest(data_encryption_key);
    const response = await this.vaultAPIFactory(credentials).ItemApi.itemsPost(request);
    return DecryptedItem.fromAPI(credentials, response);
  }

  public async update(
    credentials: IVaultToken & IDEK,
    newData: ItemUpdate
  ): Promise<DecryptedItem> {
    const response = await this.vaultAPIFactory(credentials).ItemApi.itemsIdPut(
      newData.id,
      await newData.toRequest(credentials)
    );

    return DecryptedItem.fromAPI(credentials, response);
  }

  public async removeSlot(credentials: IVaultToken, slotId: string): Promise<void> {
    this.logger.log('Removing slot');
    await this.vaultAPIFactory(credentials).SlotApi.slotsIdDelete(slotId);
    this.logger.log('Slot successfully removed');
  }

  /**
   * Get an Item and decrypt all of its Slots.
   * Works for both owned and shared Items.
   * @param id ItemId
   */
  public async get(
    credentials: IVaultToken & IKeystoreToken & IDEK & IKEK,
    id: string
  ): Promise<DecryptedItem> {
    let dataEncryptionKey = credentials.data_encryption_key;

    const result = await this.vaultAPIFactory(credentials).ItemApi.itemsIdGet(id);
    const { item } = result;

    // If the Item is from a share, use the share DEK to decrypt instead.
    // Second condition is for typecheck
    if (ItemService.itemIsFromShare(item) && item.share_id !== null) {
      const { share } = await this.vaultAPIFactory(credentials).SharesApi.incomingSharesIdGet(
        item.share_id
      );

      dataEncryptionKey = await this.getShareDEK(credentials, share);
    }

    return DecryptedItem.fromAPI({ data_encryption_key: dataEncryptionKey }, result);
  }

  public async list(
    credentials: IVaultToken,
    listFilterOptions?: IItemListFilterOptions,
    options?: IPageOptions
  ): Promise<ItemsResponse> {
    const { classificationNodeName, classificationNodeNames } =
      this.getClassifications(listFilterOptions);

    const { templateIds, scheme, sharedWith, ownerId, own, itemIds, name } =
      listFilterOptions || {};

    const result = await this.vaultAPIFactory(credentials).ItemApi.itemsGet(
      templateIds?.join(','),
      name,
      scheme,
      classificationNodeName,
      classificationNodeNames,
      sharedWith,
      ownerId,
      own !== undefined ? own.toString() : undefined,
      itemIds !== undefined ? itemIds.join(',') : undefined,
      options?.nextPageAfter,
      options?.perPage
    );

    if (resultHasNext(result) && options?.perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  // smooth over classificationNodeName/classificationNodeNames...
  private getClassifications({ classifications }: IItemListFilterOptions = {}) {
    if (!classifications) {
      return {};
    }

    if (classifications.length === 1) {
      return {
        classificationNodeName: classifications[0],
      };
    } else {
      return {
        classificationNodeNames: classifications.join(','),
      };
    }
  }

  public async listAll(
    credentials: IVaultToken,
    listFilterOptions?: IItemListFilterOptions
  ): Promise<ItemsResponse> {
    const api = this.vaultAPIFactory(credentials).ItemApi;

    const { classificationNodeName, classificationNodeNames } =
      this.getClassifications(listFilterOptions);

    const { templateIds, scheme, sharedWith, ownerId, own, name } = listFilterOptions || {};

    return getAllPaged(cursor =>
      api.itemsGet(
        templateIds?.join(','),
        name,
        scheme,
        classificationNodeName,
        classificationNodeNames,
        sharedWith,
        ownerId,
        own !== undefined ? own.toString() : undefined,
        undefined,
        cursor
      )
    ).then(reducePages);
  }

  /**
   * Behaves like [[list]] but chains [[DecryptedItem]] constructor and preserves response metadata.
   * Item attachments, thumbnails and associations are added to the appropriate Item and so are not present in
   * the result.
   *
   * If you want to pull all pages, use the following snippet
   * ```typescript
   * const allItems: DecryptedItems =
   *   await getAllPaged(cursor => listDecrypted(credentials, filterOpts, { nextPageAfter: cursor })).then(reducePages);
   * ```
   */
  public async listDecrypted(
    credentials: IVaultToken & IDEK,
    listFilterOptions?: IItemListFilterOptions,
    options?: IPageOptions
  ): Promise<DecryptedItems> {
    const { classificationNodeName, classificationNodeNames } =
      this.getClassifications(listFilterOptions);

    const { templateIds, scheme, sharedWith, ownerId, own, name } = listFilterOptions || {};

    const result = await this.vaultAPIFactory(credentials).ItemApi.itemsGet(
      templateIds?.join(','),
      name,
      scheme,
      classificationNodeName,
      classificationNodeNames,
      sharedWith,
      ownerId,
      own !== undefined ? own.toString() : undefined,
      options?.nextPageAfter,
      options?.perPage?.toString()
    );

    const slots = await Promise.all(result.slots.map(s => SlotHelpers.decryptSlot(credentials, s)));

    return {
      next_page_after: result.next_page_after,
      meta: result.meta,
      items: result.items.map(i => new DecryptedItem(i, slots, result)),
    };
  }

  /**
   * duplicating method from share-service to avoid circular dependencies
   * A shared Item may be either encrypted with a shared data-encryption key (DEK) or with
   * the user's personal DEK. This method inspects the share record and returns the appropriate
   * key.
   */
  public async getShareDEK(
    credentials: IKeystoreToken & IKEK & IDEK,
    share: Share
  ): Promise<SymmetricKey> {
    let dataEncryptionKey: SymmetricKey;

    if (share.encrypted_dek) {
      const { keypair } = await this.keystoreAPIFactory(credentials).KeypairApi.keypairsIdGet(
        share.keypair_external_id!
      );

      const decryptedPrivateKey = await DecryptedKeypair.fromAPI(
        credentials.key_encryption_key,
        keypair
      ).then(k => k.privateKey);

      dataEncryptionKey = await decryptedPrivateKey.decryptKey(share.encrypted_dek);
    } else {
      dataEncryptionKey = credentials.data_encryption_key;
    }

    return dataEncryptionKey;
  }
}

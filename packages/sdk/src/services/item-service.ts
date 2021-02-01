// import * as MeecoAzure from '@meeco/azure-block-upload';
import { Item, ItemApi, ItemsResponse, Share } from '@meeco/vault-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import DecryptedKeypair from '../models/decrypted-keypair';
import { ItemUpdate } from '../models/item-update';
import { NewItem } from '../models/new-item';
import { SymmetricKey } from '../models/symmetric-key';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService extends Service<ItemApi> {
  /**
   * True if the Item was received via a Share from another user.
   * In that case, it must be decrypted with the Share DEK, not the user's own DEK.
   * @param item
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
   * @param user
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
    templateIds?: string,
    options?: IPageOptions
  ): Promise<ItemsResponse> {
    const result = await this.vaultAPIFactory(credentials).ItemApi.itemsGet(
      templateIds,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.nextPageAfter,
      options?.perPage
    );

    if (resultHasNext(result) && options?.perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  public async listAll(credentials: IVaultToken, templateIds?: string): Promise<ItemsResponse> {
    const api = this.vaultAPIFactory(credentials).ItemApi;

    return getAllPaged(cursor =>
      api.itemsGet(templateIds, undefined, undefined, undefined, undefined, cursor)
    ).then(reducePages);
  }

  /**
   * duplicating method from share-service to avoid circular dependencies
   * A shared Item may be either encrypted with a shared data-encryption key (DEK) or with
   * the user's personal DEK. This method inspects the share record and returns the appropriate
   * key.
   * @param user
   * @param shareId
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

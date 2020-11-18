// import * as MeecoAzure from '@meeco/azure-block-upload';
import { Item, ItemApi, ItemsResponse } from '@meeco/vault-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import { ItemUpdate } from '../models/item-update';
import { NewItem } from '../models/new-item';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';
import { ShareService } from './share-service';

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
    return this.vaultAPIFactory(token.vault_access_token).ItemApi;
  }

  public async create(credentials: IVaultToken & IDEK, item: NewItem): Promise<DecryptedItem> {
    const { vault_access_token, data_encryption_key } = credentials;
    const request = await item.toRequest(data_encryption_key);
    const response = await this.vaultAPIFactory(vault_access_token).ItemApi.itemsPost(request);
    return DecryptedItem.fromAPI(credentials, response);
  }

  public async update(
    credentials: IVaultToken & IDEK,
    newData: ItemUpdate
  ): Promise<DecryptedItem> {
    const response = await this.vaultAPIFactory(credentials.vault_access_token).ItemApi.itemsIdPut(
      newData.id,
      await newData.toRequest(credentials)
    );

    return DecryptedItem.fromAPI(credentials, response);
  }

  public async removeSlot(credentials: IVaultToken, slotId: string): Promise<void> {
    this.logger.log('Removing slot');
    await this.vaultAPIFactory(credentials.vault_access_token).SlotApi.slotsIdDelete(slotId);
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

    const result = await this.vaultAPIFactory(credentials.vault_access_token).ItemApi.itemsIdGet(
      id
    );
    const { item } = result;

    // If the Item is from a share, use the share DEK to decrypt instead.
    // Second condition is for typecheck
    if (ItemService.itemIsFromShare(item) && item.share_id !== null) {
      const { share } = await this.vaultAPIFactory(
        credentials.vault_access_token
      ).SharesApi.incomingSharesIdGet(item.share_id);

      dataEncryptionKey = await new ShareService(this.environment).getShareDEK(credentials, share);
    }

    return DecryptedItem.fromAPI({ data_encryption_key: dataEncryptionKey }, result);
  }

  public async list(
    credentials: IVaultToken,
    templateIds?: string,
    options?: IPageOptions
  ): Promise<ItemsResponse> {
    const result = await this.vaultAPIFactory(credentials.vault_access_token).ItemApi.itemsGet(
      templateIds,
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
    const api = this.vaultAPIFactory(credentials.vault_access_token).ItemApi;

    return getAllPaged(cursor => api.itemsGet(templateIds, undefined, undefined, cursor)).then(
      reducePages
    );
  }
}

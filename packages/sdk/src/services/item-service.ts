// import * as MeecoAzure from '@meeco/azure-block-upload';
import { Item, ItemApi, ItemsResponse, Slot } from '@meeco/vault-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import { EncryptionKey } from '../models/encryption-key';
import { DecryptedSlot, IDecryptedSlot } from '../models/local-slot';
import { NewItem } from '../models/new-item';
import { MeecoServiceError } from '../models/service-error';
import { UpdateItem } from '../models/update-item';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import {
  VALUE_VERIFICATION_KEY_LENGTH,
  valueVerificationHash,
  verifyHashedValue,
} from '../util/value-verification';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';
import { ShareService } from './share-service';

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService extends Service<ItemApi> {
  // for mocking during testing
  private static verifyHashedValue = (<any>global).verifyHashedValue || verifyHashedValue;
  private static valueVerificationHash =
    (<any>global).valueVerificationHash || valueVerificationHash;

  /**
   * True if the Item was received via a Share from another user.
   * In that case, it must be decrypted with the Share DEK, not the user's own DEK.
   * @param item
   */
  public static itemIsFromShare(item: Item): boolean {
    return item.own === false || !!item.share_id;
  }

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  public static async decryptSlot(credentials: IDEK, slot: Slot): Promise<IDecryptedSlot> {
    const { data_encryption_key: dek } = credentials;

    const value =
      slot.encrypted && slot.encrypted_value !== null // need to check encrypted_value as binaries will also have `encrypted: true`
        ? await Service.cryppo.decryptWithKey({
            key: dek.key,
            serialized: slot.encrypted_value,
          })
        : (slot as DecryptedSlot).value;

    let decryptedValueVerificationKey: string | undefined;

    if (value != null && !slot.own && slot.encrypted_value_verification_key != null) {
      decryptedValueVerificationKey = await Service.cryppo.decryptWithKey({
        serialized: slot.encrypted_value_verification_key,
        key: dek.key,
      });

      if (
        slot.value_verification_hash !== null &&
        !ItemService.verifyHashedValue(
          decryptedValueVerificationKey as string,
          value,
          slot.value_verification_hash
        )
      ) {
        throw new MeecoServiceError(
          `Decrypted slot ${slot.name} with value ${value} does not match original value.`
        );
      }
    }

    const decrypted = {
      ...slot,
      encrypted: false,
      value,
      value_verification_key: decryptedValueVerificationKey,
    };
    return decrypted;
  }

  /**
   * Encrypt the value in the Slot. Undefined values are not changed.
   *
   * After successful encryption, Slot.encrypted = true and Slot.value is deleted.
   * @param slot
   * @param dek Data Encryption Key
   */
  public static async encryptSlot<T extends { value?: string | null | undefined }>(
    credentials: IDEK,
    slot: T
  ): Promise<Omit<T, 'value'> & { encrypted: boolean; encrypted_value: string | undefined }> {
    const { data_encryption_key: dek } = credentials;
    const encrypted = {
      ...slot,
      encrypted: false,
      encrypted_value: undefined,
    };

    if (slot.value) {
      encrypted.encrypted_value = await Service.cryppo
        .encryptWithKey({
          strategy: Service.cryppo.CipherStrategy.AES_GCM,
          key: dek.key,
          data: slot.value,
        })
        .then(result => result.serialized);

      delete encrypted.value;
      encrypted.encrypted = true;
    }

    return encrypted;
  }

  /**
   * Add a verification hash and (encrypted) key to the Slot.
   * This is necessary to share an Item that you own.
   * If you do not own the Item, then just add the fields but leave them undefined.
   * @param slot
   * @param dek Data Encryption Key
   */
  public static async addVerificationHash<
    T extends { own: boolean; value: string | undefined | null }
  >(
    slot: T,
    dek: EncryptionKey
  ): Promise<
    T & {
      value_verification_hash: string | undefined;
      encrypted_value_verification_key: string | undefined;
    }
  > {
    if (slot.own && slot.value) {
      const valueVerificationKey = Service.cryppo.generateRandomKey(
        VALUE_VERIFICATION_KEY_LENGTH
      ) as string;
      const verificationHash = ItemService.valueVerificationHash(valueVerificationKey, slot.value);
      const encryptedValueVerificationKey = await Service.cryppo
        .encryptWithKey({
          data: valueVerificationKey,
          key: dek.key,
          strategy: Service.cryppo.CipherStrategy.AES_GCM,
        })
        .then(result => result.serialized);

      return {
        ...slot,
        encrypted_value_verification_key: encryptedValueVerificationKey,
        value_verification_hash: verificationHash,
      };
    } else {
      return {
        ...slot,
        encrypted_value_verification_key: undefined,
        value_verification_hash: undefined,
      };
    }
  }

  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token.vault_access_token).ItemApi;
  }

  // TODO this should:
  // - encrypt all item slots with the given DEK
  // - remove 'value' from encrypted slots
  // - handle attachments?
  public async create(credentials: IVaultToken & IDEK, item: NewItem): Promise<DecryptedItem> {
    const { vault_access_token, data_encryption_key } = credentials;
    const request = await item.toRequest(data_encryption_key);
    const response = await this.vaultAPIFactory(vault_access_token).ItemApi.itemsPost(request);
    return DecryptedItem.fromAPI(credentials, response);
  }

  public async update(
    credentials: IVaultToken & IDEK,
    newData: UpdateItem
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

  // TODO why is IDecryptedSlot != DecryptedSlot?

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

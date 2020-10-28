// import * as MeecoAzure from '@meeco/azure-block-upload';
import { Item, ItemApi, ItemResponse, ItemsResponse, Slot } from '@meeco/vault-api-sdk';
import { EncryptionKey } from '../models/encryption-key';
import { ItemCreateData } from '../models/item-create-data';
import { ItemUpdateData } from '../models/item-update-data';
import { DecryptedSlot, IDecryptedSlot } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import {
  VALUE_VERIFICATION_KEY_LENGTH,
  valueVerificationHash,
  verifyHashedValue,
} from '../util/value-verification';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

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
  public static async addVerificationHash<T extends { own: boolean; value: string | undefined }>(
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

  public getAPI(vaultToken: string) {
    return this.vaultAPIFactory(vaultToken).ItemApi;
  }

  // TODO this should:
  // - encrypt all item slots with the given DEK
  // - remove 'value' from encrypted slots
  // - handle attachments?
  public async create(
    credentials: IVaultToken & IDEK,
    config: ItemCreateData
  ): Promise<ItemResponse> {
    const { vault_access_token } = credentials;

    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => ItemService.encryptSlot(credentials, slot))
    );

    return this.vaultAPIFactory(vault_access_token).ItemApi.itemsPost({
      template_name: config.template_name,
      item: {
        label: config.item.label,
        slots_attributes,
      },
    });
  }

  public async update(credentials: IVaultToken & IDEK, config: ItemUpdateData) {
    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => ItemService.encryptSlot(credentials, slot))
    );

    return this.vaultAPIFactory(credentials.vault_access_token).ItemApi.itemsIdPut(config.id, {
      item: {
        label: config.label,
        slots_attributes,
      },
    });
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
  public async get(user: IVaultToken & IKeystoreToken & IDEK & IKEK, id: string) {
    const vaultAccessToken = user.vault_access_token;
    let dataEncryptionKey = user.data_encryption_key;

    const result = await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdGet(id);
    const { item, slots } = result;

    // If the Item is from a share, use the share DEK to decrypt instead.
    // Second condition is for typecheck
    if (ItemService.itemIsFromShare(item) && item.share_id !== null) {
      const share = await this.vaultAPIFactory(user.vault_access_token)
        .SharesApi.incomingSharesIdGet(item.share_id)
        .then(response => response.share);

      // at this point, it may either be encrypted with shared DEK or personal...
      if (share.encrypted_dek) {
        const keyPairExternal = await this.keystoreAPIFactory(
          user.keystore_access_token
        ).KeypairApi.keypairsIdGet(share.keypair_external_id!);

        const decryptedPrivateKey = await Service.cryppo.decryptWithKey({
          serialized: keyPairExternal.keypair.encrypted_serialized_key,
          key: user.key_encryption_key.key,
        });

        dataEncryptionKey = await Service.cryppo
          .decryptSerializedWithPrivateKey({
            privateKeyPem: decryptedPrivateKey,
            serialized: share.encrypted_dek,
          })
          .then(EncryptionKey.fromRaw);
      }
      // otherwise just use default user DEK
    }

    const decryptedSlots = await Promise.all(
      slots.map(s => ItemService.decryptSlot({ data_encryption_key: dataEncryptionKey }, s))
    );

    return {
      ...result,
      slots: decryptedSlots,
    };
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

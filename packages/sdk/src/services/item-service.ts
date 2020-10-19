// import * as MeecoAzure from '@meeco/azure-block-upload';
import { Item, ItemsResponse, Slot } from '@meeco/vault-api-sdk';
import { MeecoServiceError } from '..';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { ItemCreateData } from '../models/item-create-data';
import { ItemUpdateData } from '../models/item-update-data';
import { DecryptedSlot } from '../models/local-slot';
import { Logger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import { verifyHashedValue } from '../util/value-verification';
import Service from './service';

export interface IDecryptedSlot extends Slot {
  value_verification_key?: string;
  value?: string;
}

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService extends Service {
  private static verifyHashedValue = (<any>global).verifyHashedValue || verifyHashedValue;

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  public static decryptAllSlots(
    slots: Slot[],
    dataEncryptionKey: EncryptionKey
  ): Promise<IDecryptedSlot[]> {
    return Promise.all(
      slots.map(async slot => {
        const value =
          slot.encrypted && slot.encrypted_value !== null // need to check encrypted_value as binaries will also have `encrypted: true`
            ? await Service.cryppo.decryptWithKey({
                key: dataEncryptionKey.key,
                serialized: slot.encrypted_value,
              })
            : (slot as DecryptedSlot).value;

        let decryptedValueVerificationKey: string | undefined;

        if (value != null && !slot.own && slot.encrypted_value_verification_key != null) {
          decryptedValueVerificationKey = await Service.cryppo.decryptWithKey({
            serialized: slot.encrypted_value_verification_key,
            key: dataEncryptionKey.key,
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
      })
    );
  }

  /**
   * True if the Item was received via a Share from another user.
   * In that case, it must be decrypted with the Share DEK, not the user's own DEK.
   * @param item
   */
  public static itemIsFromShare(item: Item): boolean {
    // this also implies item.own == false
    return item.share_id != null;
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }

  public async create(vaultAccessToken: string, dek: EncryptionKey, config: ItemCreateData) {
    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => this.encryptSlot(slot, dek))
    );

    return await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsPost({
      template_name: config.template_name,
      item: {
        label: config.item.label,
        slots_attributes,
      },
    });
  }

  public async update(vaultAccessToken: string, dek: EncryptionKey, config: ItemUpdateData) {
    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => this.encryptSlot(slot, dek))
    );

    return await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdPut(config.id, {
      item: {
        label: config.label,
        slots_attributes,
      },
    });
  }

  public async removeSlot(slotId: string, vaultAccessToken: string) {
    this.logger.log('Removing slot');
    await this.vaultAPIFactory(vaultAccessToken).SlotApi.slotsIdDelete(slotId);
    this.logger.log('Slot successfully removed');
  }

  public async get(id: string, user: AuthData) {
    const vaultAccessToken = user.vault_access_token;
    let dataEncryptionKey = user.data_encryption_key;

    const result = await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdGet(id);
    const { item, slots } = result;

    // If the Item is from a share, use the share DEK to decrypt instead.
    if (ItemService.itemIsFromShare(item) && item.share_id !== null) {
      const share = await this.vaultAPIFactory(user)
        .SharesApi.incomingSharesIdGet(item.share_id)
        .then(response => response.share);

      const keyPairExternal = await this.keystoreAPIFactory(user).KeypairApi.keypairsIdGet(
        share.keypair_external_id!
      );

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

    const decryptedSlots = await ItemService.decryptAllSlots(slots, dataEncryptionKey);

    return {
      ...result,
      slots: decryptedSlots,
    };
  }

  private async encryptSlot(slot: DecryptedSlot, dek: EncryptionKey) {
    const encrypted: any = {
      ...slot,
    };
    encrypted.encrypted_value = await Service.cryppo
      .encryptWithKey({
        strategy: Service.cryppo.CipherStrategy.AES_GCM,
        key: dek.key,
        data: slot.value || '',
      })
      .then(result => result.serialized);
    delete encrypted.value;
    encrypted.encrypted = true;
    return encrypted;
  }

  public async list(
    vaultAccessToken: string,
    templateIds?: string,
    nextPageAfter?: string,
    perPage?: number
  ) {
    const result = await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsGet(
      templateIds,
      undefined,
      undefined,
      nextPageAfter,
      perPage
    );

    if (resultHasNext(result) && perPage === undefined) {
      // TODO - needs a warning logger
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  public async listAll(vaultAccessToken: string, templateIds?: string): Promise<ItemsResponse> {
    const api = this.vaultAPIFactory(vaultAccessToken).ItemApi;

    return getAllPaged(cursor => api.itemsGet(templateIds, undefined, undefined, cursor)).then(
      reducePages
    );
  }
}

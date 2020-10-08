// import * as MeecoAzure from '@meeco/azure-block-upload';
import { ItemsResponse, Slot } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { ItemCreateData } from '../models/item-create-data';
import { ItemUpdateData } from '../models/item-update-data';
import { DecryptedSlot } from '../models/local-slot';
import cryppo from '../services/cryppo-service';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, SimpleLogger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import { ShareService } from './share-service';

export interface IDecryptedSlot extends Slot {
  value_verification_key?: string;
  value?: string;
}

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService {
  private static cryppo = (<any>global).cryppo || cryppo;
  private vaultAPIFactory: VaultAPIFactory;
  private shareService: ShareService;
  private logger: IFullLogger;

  constructor(environment: Environment, log: SimpleLogger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);

    this.shareService = new ShareService(environment, log);
    this.logger = toFullLogger(log);
  }

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  public static decryptAllSlots(
    slots: Slot[],
    dataEncryptionKey: EncryptionKey
  ): Promise<IDecryptedSlot[]> {
    return Promise.all(
      slots.map(async slot => {
        let value =
          slot.encrypted && slot.encrypted_value !== null // need to check encrypted_value as binaries will also have `encrypted: true`
            ? await this.cryppo.decryptWithKey({
                key: dataEncryptionKey.key,
                serialized: slot.encrypted_value,
              })
            : (slot as DecryptedSlot).value;

        let decryptedValueVerificationKey: string | undefined;

        if (value != null && !slot.own && slot.encrypted_value_verification_key != null) {
          decryptedValueVerificationKey = await this.cryppo.decryptWithKey({
            serialized: slot.encrypted_value_verification_key,
            key: dataEncryptionKey.key,
          });

          value =
            ShareService.generate_value_verification_hash(
              decryptedValueVerificationKey as string,
              value
            ) === slot.value_verification_hash
              ? value
              : 'Invalid Value: failed to verify integrity of slot value';
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
    const dataEncryptionKey = user.data_encryption_key;

    const result = await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdGet(id);

    // this could be improved, consider finding a way of using only one item get call.
    if (result.item.share_id != null) {
      return this.shareService.getSharedItemIncoming(user, result.item.share_id);
    }

    const slots = await ItemService.decryptAllSlots(result.slots, dataEncryptionKey);

    return {
      ...result,
      slots,
    };
  }

  private async encryptSlot(slot: DecryptedSlot, dek: EncryptionKey) {
    const encrypted: any = {
      ...slot,
    };
    encrypted.encrypted_value = await ItemService.cryppo
      .encryptWithKey({
        strategy: ItemService.cryppo.CipherStrategy.AES_GCM,
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

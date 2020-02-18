import * as cryppo from '@meeco/cryppo';
import { CipherStrategy, encryptWithKey } from '@meeco/cryppo';
import { ItemApi, Slot } from '@meeco/meeco-api-sdk';
import { ItemConfig } from '../configs/item-config';
import { ItemListConfig } from '../configs/item-list-config';
import { EncryptionKey } from '../models/encryption-key';
import { IEnvironment } from '../models/environment';

export class ItemService {
  constructor(private environment: IEnvironment) {}

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  public static decryptAllSlots(slots: Slot[], dataEncryptionKey: EncryptionKey): Promise<Slot[]> {
    return Promise.all(
      slots.map(async slot => {
        const value = slot.encrypted
          ? await cryppo.decryptWithKey({
              key: dataEncryptionKey.key,
              serialized: slot.encrypted_value
            })
          : slot.value;
        const decrypted = {
          ...slot,
          encrypted: false,
          value
        };
        return decrypted as Slot;
      })
    );
  }

  public async create(accessToken: string, dek: EncryptionKey, config: ItemConfig) {
    const itemApi = new ItemApi({
      apiKey: accessToken,
      basePath: this.environment.vault.url
    });

    const slots_attributes = await Promise.all(
      (config.itemConfig.slots || []).map(slot => this.encryptSlot(slot, dek))
    );

    const result = await itemApi.itemsPost({
      template_name: config.templateName,
      item: {
        label: config.itemConfig.label,
        slots_attributes
      }
    });
    return ItemConfig.encodeFromJson({
      ...result.item,
      slots: result.slots?.map(slot => ({
        ...slot
      }))
    });
  }

  public async get(id: string, accessToken: string, dataEncryptionKey: EncryptionKey) {
    const itemApi = new ItemApi({
      apiKey: accessToken,
      basePath: this.environment.vault.url
    });
    const result = await itemApi.itemsIdGet(id);
    const { item } = result;
    const slots = await ItemService.decryptAllSlots(result.slots, dataEncryptionKey);
    return ItemConfig.encodeFromJson({
      ...item,
      slots
    });
  }

  private async encryptSlot(slot: Slot, dek: EncryptionKey) {
    const encrypted: any = {
      ...slot
    };
    encrypted.encrypted_value = await encryptWithKey({
      strategy: CipherStrategy.AES_GCM,
      key: dek.key,
      data: slot.value || ''
    }).then(result => result.serialized);
    delete encrypted.value;
    encrypted.encrypted = true;
    return encrypted;
  }

  public async list(accessToken: string) {
    const itemApi = new ItemApi({
      apiKey: accessToken,
      basePath: this.environment.vault.url
    });

    const result = await itemApi.itemsGet();
    return ItemListConfig.encodeFromJson(result);
  }
}

import { AttachmentResponse, Slot, ThumbnailResponse } from '@meeco/vault-api-sdk';
import { Buffer as _buffer } from 'buffer';
import * as Jimp from 'jimp';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { FileAttachmentData } from '../models/file-attachment-data';
import { ItemCreateData } from '../models/item-create-data';
import { ItemUpdateData } from '../models/item-update-data';
import { DecryptedSlot } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import cryppo from '../services/cryppo-service';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';

/**
 * Used for fetching and sending `Items` to and from the Vault.
 */
export class ItemService {
  private static cryppo = (<any>global).cryppo || cryppo;
  private vaultAPIFactory: VaultAPIFactory;

  constructor(environment: Environment, private log: (message: string) => void = () => {}) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
  }

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  public static decryptAllSlots(
    slots: Slot[],
    dataEncryptionKey: EncryptionKey
  ): Promise<DecryptedSlot[]> {
    return Promise.all(
      slots.map(async slot => {
        const value =
          slot.encrypted && slot.encrypted_value !== null // need to check encrypted_value as binaries will also have `encrypted: true`
            ? await this.cryppo.decryptWithKey({
                key: dataEncryptionKey.key,
                serialized: slot.encrypted_value
              })
            : (slot as DecryptedSlot).value;
        const decrypted = {
          ...slot,
          encrypted: false,
          value
        };
        return decrypted;
      })
    );
  }

  public async create(vaultAccessToken: string, dek: EncryptionKey, config: ItemCreateData) {
    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => this.encryptSlot(slot, dek))
    );

    return await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsPost({
      template_name: config.template_name,
      item: {
        label: config.item.label,
        slots_attributes
      }
    });
  }

  public async update(vaultAccessToken: string, dek: EncryptionKey, config: ItemUpdateData) {
    const slots_attributes = await Promise.all(
      (config.slots || []).map(slot => this.encryptSlot(slot, dek))
    );

    return await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdPut(config.id, {
      item: {
        label: config.label,
        slots_attributes
      }
    });
  }

  private async generateAndUploadThumbnail(
    file: Buffer | Uint8Array | ArrayBuffer,
    binaryId: string,
    auth: AuthData
  ) {
    const targetThumbnailSize = 256;
    const sizeType = `png_${targetThumbnailSize}x${targetThumbnailSize}`;

    this.log('Generating image thumbnail');
    const jimp = await Jimp.read(file as any);
    const thumbnail: Buffer = await jimp
      .resize(targetThumbnailSize, targetThumbnailSize)
      .getBufferAsync(Jimp.MIME_PNG);

    this.log('Encrypting image thumbnail');
    const encryptedThumbnail = await ItemService.cryppo.encryptWithKey({
      key: auth.data_encryption_key.key,
      data: ItemService.cryppo.binaryBufferToString(thumbnail),
      strategy: ItemService.cryppo.CipherStrategy.AES_GCM
    });

    this.log('Uploading encrypted image thumbnail');
    let response: ThumbnailResponse;
    try {
      const blob =
        typeof Blob === 'function'
          ? new Blob([encryptedThumbnail.serialized])
          : _buffer.from(encryptedThumbnail.serialized, 'binary');
      response = await this.vaultAPIFactory(auth).ThumbnailApi.thumbnailsPost(
        blob as any,
        binaryId,
        sizeType
      );
    } catch (err) {
      this.log('Error uploading encrypted thumbnail file!');
      throw err;
    }

    return response;
  }

  public async attachFile(config: FileAttachmentData, auth: AuthData) {
    const { itemId, label, file, fileName, fileType } = config;
    this.log('Reading file');

    this.log('Fetching item');
    const itemFetchResult = await this.get(
      itemId,
      auth.vault_access_token,
      auth.data_encryption_key
    ).catch(err => {
      throw new MeecoServiceError(
        `Unable to find item '${itemId}' - please check that the item exists for the current user.`
      );
    });

    this.log('Encrypting File');
    const encryptedFile = await ItemService.cryppo.encryptWithKey({
      key: auth.data_encryption_key.key,
      data: ItemService.cryppo.binaryBufferToString(file),
      strategy: ItemService.cryppo.CipherStrategy.AES_GCM
    });

    let uploadedBinary: AttachmentResponse;
    try {
      this.log('Uploading encrypted file');
      const blob =
        typeof Blob === 'function'
          ? new Blob([encryptedFile.serialized])
          : _buffer.from(encryptedFile.serialized, 'binary');
      uploadedBinary = await this.vaultAPIFactory(
        auth.vault_access_token
      ).AttachmentApi.attachmentsPost(blob as any, fileName, fileType);
    } catch (err) {
      this.log('Upload encrypted file failed - removing temp encrypted version');
      throw err;
    }

    if (fileType.startsWith('image/')) {
      try {
        await this.generateAndUploadThumbnail(file, uploadedBinary.attachment.id, auth);
      } catch (err) {
        console.log('Creating thumbnail failed - continuing without thumbnail');
        console.log(err.message);
      }
    }

    this.log('Adding attachment to item');
    const updated = await this.vaultAPIFactory(auth.vault_access_token).ItemApi.itemsIdPut(
      itemFetchResult.item.id,
      {
        item: {
          slots_attributes: [
            {
              label,
              slot_type_name: 'attachment',
              attachments_attributes: [
                {
                  id: uploadedBinary.attachment.id
                }
              ]
            }
          ]
        }
      }
    );

    this.log('File was successfully attached');
    return updated;
  }

  private async downloadAndDecryptFile<T extends Blob>(
    download: () => Promise<T>,
    dataEncryptionKey: EncryptionKey
  ) {
    const result = await download();
    const buffer = await (<any>result).arrayBuffer();
    const encryptedContents = await ItemService.cryppo.binaryBufferToString(buffer);
    const decryptedContents = await ItemService.cryppo.decryptWithKey({
      serialized: encryptedContents,
      key: dataEncryptionKey.key
    });
    return decryptedContents;
  }

  public async downloadAttachment(
    id: string,
    vaultAccessToken: string,
    dataEncryptionKey: EncryptionKey
  ) {
    this.log('Downloading attachment');
    return this.downloadAndDecryptFile(
      () => this.vaultAPIFactory(vaultAccessToken).AttachmentApi.attachmentsIdDownloadGet(id),
      dataEncryptionKey
    );
  }

  public async downloadThumbnail(
    id: string,
    vaultAccessToken: string,
    dataEncryptionKey: EncryptionKey
  ) {
    this.log('Downloading thumbnail');
    return this.downloadAndDecryptFile(
      () => this.vaultAPIFactory(vaultAccessToken).ThumbnailApi.thumbnailsIdGet(id),
      dataEncryptionKey
    );
  }

  public async removeSlot(slotId: string, vaultAccessToken: string) {
    this.log('Removing slot');
    await this.vaultAPIFactory(vaultAccessToken).SlotApi.slotsIdDelete(slotId);
    this.log('Slot successfully removed');
  }

  public async get(id: string, vaultAccessToken: string, dataEncryptionKey: EncryptionKey) {
    const result = await this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsIdGet(id);
    const slots = await ItemService.decryptAllSlots(result.slots, dataEncryptionKey);

    return {
      ...result,
      slots
    };
  }

  private async encryptSlot(slot: DecryptedSlot, dek: EncryptionKey) {
    const encrypted: any = {
      ...slot
    };
    encrypted.encrypted_value = await ItemService.cryppo
      .encryptWithKey({
        strategy: ItemService.cryppo.CipherStrategy.AES_GCM,
        key: dek.key,
        data: slot.value || ''
      })
      .then(result => result.serialized);
    delete encrypted.value;
    encrypted.encrypted = true;
    return encrypted;
  }

  public list(vaultAccessToken: string) {
    return this.vaultAPIFactory(vaultAccessToken).ItemApi.itemsGet();
  }
}

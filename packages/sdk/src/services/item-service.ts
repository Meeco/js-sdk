// import * as MeecoAzure from '@meeco/azure-block-upload';
import {
  AttachmentDirectUploadUrlResponse,
  AttachmentResponse,
  CreateAttachmentResponse,
  Item,
  ItemsResponse,
  PostAttachmentDirectUploadUrlRequest,
  Slot,
  ThumbnailResponse,
} from '@meeco/vault-api-sdk';
import { Buffer as _buffer } from 'buffer';
import * as Jimp from 'jimp';
import { AuthData } from '../models/auth-data';
import { IDirectAttachmentAttachData } from '../models/direct-attachment-attach-data';
import { IDirectAttachmentUploadUrlData } from '../models/direct-attachment-upload-url-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { FileAttachmentData } from '../models/file-attachment-data';
import { ItemCreateData } from '../models/item-create-data';
import { ItemUpdateData } from '../models/item-update-data';
import { DecryptedSlot } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import cryppo from '../services/cryppo-service';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory,
} from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, SimpleLogger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import { verifyHashedValue } from '../util/value-verification';

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
  private keystoreAPIFactory: KeystoreAPIFactory;
  private logger: IFullLogger;
  // for mocking during testing
  private cryppo = (<any>global).cryppo || cryppo;

  constructor(environment: Environment, log: SimpleLogger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.keystoreAPIFactory = keystoreAPIFactory(environment);

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
        const value =
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

          if (
            slot.value_verification_hash !== null &&
            !verifyHashedValue(
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

  private async generateAndUploadThumbnail(
    file: Buffer | Uint8Array | ArrayBuffer,
    binaryId: string,
    auth: AuthData
  ) {
    const targetThumbnailSize = 256;
    const sizeType = `png_${targetThumbnailSize}x${targetThumbnailSize}`;

    this.logger.log('Generating image thumbnail');
    const jimp = await Jimp.read(file as any);
    const thumbnail: Buffer = await jimp
      .resize(targetThumbnailSize, targetThumbnailSize)
      .getBufferAsync(Jimp.MIME_PNG);

    this.logger.log('Encrypting image thumbnail');
    const encryptedThumbnail = await ItemService.cryppo.encryptWithKey({
      key: auth.data_encryption_key.key,
      data: ItemService.cryppo.binaryBufferToString(thumbnail),
      strategy: ItemService.cryppo.CipherStrategy.AES_GCM,
    });

    this.logger.log('Uploading encrypted image thumbnail');
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
      this.logger.log('Error uploading encrypted thumbnail file!');
      throw err;
    }

    return response;
  }

  public async attachFile(config: FileAttachmentData, auth: AuthData) {
    const { itemId, label, file, fileName, fileType } = config;
    this.logger.log('Reading file');

    this.logger.log('Fetching item');
    const itemFetchResult = await this.get(itemId, auth).catch(err => {
      if ((<Response>err).status === 404) {
        throw new MeecoServiceError(
          `Unable to find item '${itemId}' - please check that the item exists for the current user.`
        );
      }
      throw err;
    });

    this.logger.log('Encrypting File');
    const encryptedFile = await ItemService.cryppo.encryptWithKey({
      key: auth.data_encryption_key.key,
      data: ItemService.cryppo.binaryBufferToString(file),
      strategy: ItemService.cryppo.CipherStrategy.AES_GCM,
    });

    let uploadedBinary: AttachmentResponse;
    try {
      this.logger.log('Uploading encrypted file');
      const blob =
        typeof Blob === 'function'
          ? new Blob([encryptedFile.serialized])
          : _buffer.from(encryptedFile.serialized, 'binary');
      uploadedBinary = await this.vaultAPIFactory(
        auth.vault_access_token
      ).AttachmentApi.attachmentsPost(blob as any, fileName, fileType);
    } catch (err) {
      this.logger.log('Upload encrypted file failed - removing temp encrypted version');
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

    this.logger.log('Adding attachment to item');
    const updated = await this.vaultAPIFactory(auth.vault_access_token).ItemApi.itemsIdPut(
      itemFetchResult.item.id,
      {
        item: {
          slots_attributes: [
            {
              label,
              slot_type_name: 'attachment',
              attachment_attributes: {
                id: uploadedBinary.attachment.id,
              },
            },
          ],
        },
      }
    );

    this.logger.log('File was successfully attached');
    return updated;
  }

  public async directAttachmentUploadUrl(
    config: IDirectAttachmentUploadUrlData,
    auth: AuthData
  ): Promise<AttachmentDirectUploadUrlResponse> {
    let uploadUrl;
    try {
      this.logger.log('Getting Direct Attachment Upload Url');
      const params: PostAttachmentDirectUploadUrlRequest = {
        blob: {
          filename: config.fileName,
          content_type: config.fileType,
          byte_size: config.fileSize,
        },
      };
      const factory = this.vaultAPIFactory(auth.vault_access_token);
      uploadUrl = await factory.DirectAttachmentsApi.directAttachmentsUploadUrlPost(params);
    } catch (err) {
      this.logger.log('Upload encrypted file failed - removing temp encrypted version');
      throw err;
    }
    return uploadUrl;
  }

  public async getDirectAttachmentInfo(
    config: { attachmentId: string },
    auth: AuthData
  ): Promise<any> {
    let uploadUrl;
    try {
      this.logger.log('Getting Direct Attachment Info');
      const factory = this.vaultAPIFactory(auth.vault_access_token);
      uploadUrl = await factory.DirectAttachmentsApi.directAttachmentsIdGet(config.attachmentId);
    } catch (err) {
      this.logger.log('Upload encrypted file failed - removing temp encrypted version');
      throw err;
    }
    return uploadUrl;
  }

  public async directAttachmentAttach(
    config: IDirectAttachmentAttachData,
    auth: AuthData
  ): Promise<CreateAttachmentResponse> {
    const factory = this.vaultAPIFactory(auth.vault_access_token);
    const attachment = await factory.DirectAttachmentsApi.directAttachmentsPost({
      blob: {
        blob_id: config.blobId,
        blob_key: config.blobKey,
        encrypted_artifact_blob_id: config.artifactsBlobId,
        encrypted_artifact_blob_key: config.artifactsBlobKey,
      },
    });
    return attachment;
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
      key: dataEncryptionKey.key,
    });
    return decryptedContents;
  }

  public async downloadAttachment(
    id: string,
    vaultAccessToken: string,
    dataEncryptionKey: EncryptionKey
  ) {
    this.logger.log('Downloading attachment');
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
    this.logger.log('Downloading thumbnail');
    return this.downloadAndDecryptFile(
      () => this.vaultAPIFactory(vaultAccessToken).ThumbnailApi.thumbnailsIdGet(id),
      dataEncryptionKey
    );
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

      const decryptedPrivateKey = await this.cryppo.decryptWithKey({
        serialized: keyPairExternal.keypair.encrypted_serialized_key,
        key: user.key_encryption_key.key,
      });

      dataEncryptionKey = await this.cryppo
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

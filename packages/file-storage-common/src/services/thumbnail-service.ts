import {
  binaryStringToBytesBuffer,
  CipherStrategy,
  decryptWithKey,
  EncryptionKey,
  encryptWithKey,
} from '@meeco/cryppo';
import { ThumbnailApi } from '@meeco/vault-api-sdk';
import axios from 'axios';
import { buildApiConfig, getBlobHeaders, IFileStorageAuthConfiguration } from '../auth';

export type ThumbnailType =
  | '128x128/jpg'
  | '256x256/jpg'
  | '512x512/jpg'
  | '128x128/png'
  | '256x256/png'
  | '512x512/png';

export const ThumbnailTypes: ThumbnailType[] = [
  '128x128/jpg',
  '256x256/jpg',
  '512x512/jpg',
  '128x128/png',
  '256x256/png',
  '512x512/png',
];

/**
 * Convert a string like "128x128/jpg" to mimeType + file extension, e.g. "image/jpg" and "jpg".
 */
export function thumbSizeTypeToMimeExt(
  sizeTypeString: ThumbnailType | string
): { mimeType: string; fileExtension: string } {
  let mimeType;
  let fileExtension;
  switch (sizeTypeString.split('/')[1]) {
    case 'jpg':
      mimeType = 'image/jpg';
      fileExtension = 'jpg';
      break;
    case 'png':
      mimeType = 'image/png';
      fileExtension = 'png';
      break;
    default:
      throw new Error('file extension not known');
  }
  return { mimeType, fileExtension };
}

export class ThumbnailService {
  constructor(private vaultUrl: string, private fetchApi?: any) {}

  /**
   * @param {object} __namedParameters Options
   * @param thumbnail
   * @param attachmentId Id of Attachment this thumbnail is for
   * @param key Symmetric key used to encrypt the thumbnail. Usually should be the user's DEK.
   * @param authConfig
   */
  async upload({
    thumbnail,
    attachmentId,
    key,
    authConfig,
  }: {
    thumbnail: {
      data: Uint8Array;
      sizeType: ThumbnailType;
    };
    attachmentId: string;
    key: EncryptionKey;
    authConfig: IFileStorageAuthConfiguration;
  }) {
    const encryptedThumbnail = await encryptWithKey({
      key,
      data: thumbnail.data,
      strategy: CipherStrategy.AES_GCM,
    });

    if (!encryptedThumbnail.serialized) {
      throw new Error('Error encrypting thumbnail file');
    }

    // TODO: confirm this does the right thing
    // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
    // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer
    const blob =
      typeof Blob === 'function'
        ? new Blob([encryptedThumbnail.serialized])
        : binaryStringToBytesBuffer(encryptedThumbnail.serialized);

    const api = new ThumbnailApi(buildApiConfig(authConfig, this.vaultUrl, this.fetchApi));

    return api.thumbnailsPost(blob as any, attachmentId, thumbnail.sizeType);
  }

  /**
   * @param {object} __namedParameters Options
   * @param id Id of the thumbnail to download.
   * @param key Symmetric key used to encrypt the thumbnail.
   */
  async download({
    id,
    key,
    authConfig,
  }: {
    id: string;
    key: EncryptionKey;
    authConfig: IFileStorageAuthConfiguration;
  }): Promise<Uint8Array> {
    const api = new ThumbnailApi(buildApiConfig(authConfig, this.vaultUrl, this.fetchApi));
    const { redirect_url } = await api.thumbnailsIdGet(id);
    const result = await this.thumbnailDownload(authConfig, redirect_url);

    const decryptedContents = await decryptWithKey({
      serialized: result.data,
      key,
    });

    if (!decryptedContents) {
      throw new Error('Error decrypting thumbnail file');
    }

    return decryptedContents;
  }

  private async thumbnailDownload(authConfig: IFileStorageAuthConfiguration, url: string) {
    return axios({
      method: 'get',
      url,
      headers: getBlobHeaders(authConfig),
    });
  }
}

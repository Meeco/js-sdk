import { binaryStringToBytesBuffer, CipherStrategy, EncryptionKey } from '@meeco/cryppo';
import { RedirectResponse, Thumbnail, ThumbnailApi } from '@meeco/vault-api-sdk';
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
export function thumbSizeTypeToMimeExt(sizeTypeString: ThumbnailType | string): {
  mimeType: string;
  fileExtension: string;
} {
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
  constructor(private vaultUrl: string, private cryppoService: any, private fetchApi?: any) {}

  /**
   * @param {object} __namedParameters Options
   * @param thumbnail
   * @param attachmentId Id of Attachment this thumbnail is for
   * @param key Symmetric key used to encrypt the thumbnail. Usually should be the user's DEK.
   * @param authConfig
   */
  protected async _upload({
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
  }): Promise<Thumbnail> {
    const encryptedThumbnail = await this.cryppoService.encryptWithKey({
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

    const { thumbnail: result } = await api.thumbnailsPost(
      blob as any,
      attachmentId,
      thumbnail.sizeType
    );
    return result;
  }

  /**
   * @param {object} __namedParameters Options
   * @param id Id of the thumbnail to download.
   * @param key Symmetric key used to encrypt the thumbnail.
   */
  protected async _download({
    id,
    key,
    authConfig,
  }: {
    id: string;
    key: EncryptionKey;
    authConfig: IFileStorageAuthConfiguration;
  }): Promise<Uint8Array> {
    const api = new ThumbnailApi(buildApiConfig(authConfig, this.vaultUrl, this.fetchApi));

    let urlResponse: RedirectResponse;
    try {
      urlResponse = await api.thumbnailsIdGet(id);
    } catch (e: any) {
      throw new Error('Could not get Thumbnail URL. Http code: ' + e?.status);
    }

    const url = urlResponse.redirect_url;
    const result = await this.fetchApi(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: getBlobHeaders(authConfig),
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    });

    if (result.status === 404) {
      throw new Error('Thumbnail not found');
    }

    try {
      const decryptedContents = await this.cryppoService.decryptWithKey({
        serialized: await result.text(),
        key,
      });

      if (!decryptedContents) {
        throw new Error('No data after decryption');
      }

      return decryptedContents;
    } catch (e: any) {
      throw new Error('Failed to decrypt downloaded file: ' + e?.message);
    }
  }
}

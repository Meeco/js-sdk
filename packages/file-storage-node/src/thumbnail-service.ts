import * as Common from '@meeco/file-storage-common';
import { EncryptionKey } from '@meeco/cryppo';
import { Thumbnail } from '@meeco/vault-api-sdk';
import * as fs from 'fs';
import * as cryppo from '@meeco/cryppo';

export class ThumbnailService extends Common.ThumbnailService {
  constructor(vaultUrl: string, _cryppo = cryppo) {
    super(vaultUrl, _cryppo, (url, args) => (<any>global).fetch(url, args));
  }

  /**
   * Reads a file from a system path [[thumbnailFilePath]] and uploads.
   * @returns Metadata about the created Thumbnail including its id and url.
   */
  async upload({
    thumbnailFilePath,
    binaryId,
    attachmentDek,
    sizeType,
    authConfig,
  }: {
    thumbnailFilePath: string;
    binaryId: string;
    attachmentDek: EncryptionKey;
    sizeType: Common.ThumbnailType;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Thumbnail> {
    const thumbnail = fs.readFileSync(thumbnailFilePath);

    return this._upload({
      thumbnail: { data: thumbnail, sizeType },
      attachmentId: binaryId,
      key: attachmentDek,
      authConfig,
    });
  }

  async download({
    id,
    dataEncryptionKey,
    authConfig,
  }: {
    id: string;
    dataEncryptionKey: EncryptionKey;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Uint8Array> {
    // TODO should this be Buffer?
    return this._download({ id, key: dataEncryptionKey, authConfig });
  }
}

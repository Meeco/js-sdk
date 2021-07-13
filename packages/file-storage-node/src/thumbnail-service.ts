import * as cryppo from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { Thumbnail } from '@meeco/vault-api-sdk';
import FormData from 'form-data';
import * as fs from 'fs';
import fetch from 'node-fetch';

export class ThumbnailService extends Common.ThumbnailService {
  constructor(vaultUrl: string, _cryppo = cryppo) {
    super(vaultUrl, _cryppo, (url, args) => fetch(url, args));
  }

  /**
   * Reads a file from a system path [[thumbnailFilePath]] and uploads.
   * @returns Metadata about the created Thumbnail including its id and url.
   */
  upload({
    thumbnailFilePath,
    attachmentId,
    key,
    sizeType,
    authConfig,
  }: {
    thumbnailFilePath: string;
    attachmentId: string;
    key: EncryptionKey;
    sizeType: Common.ThumbnailType;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Thumbnail> {
    // polyfill missing FormData in OpenAPI when used in nodejs
    if (!(<any>global).FormData) {
      (<any>global).FormData = FormData;
    }

    const thumbnail = fs.readFileSync(thumbnailFilePath);

    return this._upload({
      thumbnail: { data: thumbnail, sizeType },
      attachmentId,
      key,
      authConfig,
    });
  }

  download(args: {
    id: string;
    key: EncryptionKey;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Buffer> {
    return this._download(args).then(Buffer.from);
  }
}

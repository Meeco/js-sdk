import * as cryppo from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { Thumbnail } from '@meeco/vault-api-sdk';

/** Upload or download thumbnails using the browser's fetch API */
export class ThumbnailService extends Common.ThumbnailService {
  constructor(vaultUrl: string, _cryppo = cryppo) {
    super(vaultUrl, _cryppo, (url, args) => window.fetch(url, args));
  }

  upload(args: {
    thumbnail: {
      data: Uint8Array;
      sizeType: Common.ThumbnailType;
    };
    attachmentId: string;
    key: EncryptionKey;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Thumbnail> {
    return this._upload(args);
  }

  download(args: {
    id: string;
    key: EncryptionKey;
    authConfig: Common.IFileStorageAuthConfiguration;
  }): Promise<Uint8Array> {
    return this._download(args);
  }
}

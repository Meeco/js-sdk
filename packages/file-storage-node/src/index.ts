import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { IFileStorageAuthConfiguration, ThumbnailType } from '@meeco/file-storage-common';
import { AttachmentDirectDownloadUrl, Thumbnail } from '@meeco/vault-api-sdk';
import * as Latest from './lib';

/**
 * Record v 3.1.1 interface
 * Note that removal of data_encryption_key from IFilestorageauthconfiguration is a breaking change anyway.
 * Deprecations will be removed in v.5.0.0 release
 */

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

/** @deprecated Use [[uploadAttachment]] */
export const largeFileUploadNode: (
  filePath: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration
) => Promise<{ attachment: any; dek: EncryptionKey }> = Latest.uploadAttachment;

/** @deprecated Use [[downloadAttachment]] */
export const fileDownloadNode: (
  attachmentId: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration,
  attachmentDek: EncryptionKey,
  logFunction?: any
) => Promise<{ fileName: string; buffer: Buffer }> = Latest.downloadAttachment;

/** @deprecated Use [[downloadAttachment]] */
export const largeFileDownloadNode: (
  attachmentID: string,
  dek: EncryptionKey,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
) => Promise<{ byteArray: Buffer; direct_download: AttachmentDirectDownloadUrl }> =
  Latest.largeFileDownloadNode;

/** @deprecated Use [[Latest.uploadThumbnail]] */
export const encryptAndUploadThumbnail: (_: {
  thumbnailFilePath: string;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}) => Promise<Thumbnail> = Latest.uploadThumbnail;

export async function downloadThumbnail({
  id,
  dataEncryptionKey,
  vaultUrl,
  authConfig,
}: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}): Promise<Uint8Array> {
  const service = new Common.ThumbnailService(vaultUrl, (url, args) =>
    (<any>global).fetch(url, args)
  );
  return service.download({ id, key: dataEncryptionKey, authConfig });
}

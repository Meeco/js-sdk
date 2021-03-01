import { EncryptionKey } from '@meeco/cryppo';
import { IFileStorageAuthConfiguration, ThumbnailType } from '@meeco/file-storage-common';
import { AttachmentDirectDownloadUrl, ThumbnailResponse } from '@meeco/vault-api-sdk';
import * as Latest from './index';
import * as Common from '@meeco/file-storage-common';

// API types at v. 3.1.2

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

export const largeFileUploadNode: (
  filePath: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration
) => Promise<{ attachment: any; dek: EncryptionKey }> = Latest.largeFileUploadNode;

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
) => Promise<{ fileName: string; buffer: Buffer }> = Latest.fileDownloadNode;

export const largeFileDownloadNode: (
  attachmentID: string,
  dek: EncryptionKey,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
) => Promise<{ byteArray: Buffer; direct_download: AttachmentDirectDownloadUrl }> =
  Latest.largeFileDownloadNode;

export const encryptAndUploadThumbnail: (_: {
  thumbnailFilePath: string;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}) => Promise<ThumbnailResponse> = Latest.encryptAndUploadThumbnail;

export const downloadThumbnail: (_: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}) => Promise<Uint8Array> = Latest.downloadThumbnail;

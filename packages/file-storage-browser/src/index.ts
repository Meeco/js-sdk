import { EncryptionKey } from '@meeco/cryppo';
import { IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { DirectAttachment, ThumbnailResponse } from '@meeco/vault-api-sdk';

import * as Common from '@meeco/file-storage-common';
import * as Latest from './lib';

/**
 * Record v 3.1.2 interface
 * Note that removal of data_encryption_key from IFilestorageauthconfiguration is a breaking change anyway.
 * Deprecations will be removed in v.5.0.0 release
 */

export { ThumbnailType, ThumbnailTypes, uploadThumbnail } from '@meeco/file-storage-common';
export { downloadAttachment, uploadAttachment } from './lib';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

export const downloadThumbnail: ({
  id,
  dataEncryptionKey,
  vaultUrl,
  authConfig,
}: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}) => Promise<Uint8Array> = Common.downloadThumbnail;

/** @deprecated Use [[uploadThumbnail]] */
export const encryptAndUploadThumbnail: ({
  thumbnail,
  binaryId,
  attachmentDek,
  sizeType,
  authConfig,
  vaultUrl,
  fetchApi,
}: {
  thumbnail: Uint8Array;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: Common.ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
  fetchApi?: any;
}) => Promise<ThumbnailResponse> = Common.uploadThumbnail;

/** @deprecated Use [[uploadAttachment]] */
export const fileUploadBrowser: (_: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
  onCancel?: any;
}) => Promise<{ attachment: DirectAttachment; dek: EncryptionKey }> = Latest.uploadAttachment;

// TODO: deprecate uploadWithCancel functions and merge that capability to upload
export const fileUploadBrowserWithCancel: (_: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
}) => {
  cancel: () => void;
  success: Promise<{ attachment: DirectAttachment; dek: EncryptionKey }>;
} = Latest.fileUploadBrowserWithCancel;

/** @deprecated Use [[downloadAttachment]] */
export const fileDownloadBrowser: (_: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}) => Promise<File> = Latest.downloadAttachment;

export const fileDownloadBrowserWithCancel: (_: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}) => { cancel: () => void; success: Promise<File> } = Latest.fileDownloadBrowserWithCancel;

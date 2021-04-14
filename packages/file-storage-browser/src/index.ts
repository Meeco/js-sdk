import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { DirectAttachment, Thumbnail } from '@meeco/vault-api-sdk';
import * as Latest from './lib';
import { ThumbnailService } from './thumbnail-service';

/**
 * API v4.0.0
 * Deprecations will be removed in v.5.0.0 release
 */

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';
export { AttachmentService } from './lib';
export * from './thumbnail-service';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

/** @deprecated Use [[ThumbnailService.download]] */
export function downloadThumbnail({
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
  const service = new ThumbnailService(vaultUrl);
  return service.download({ id, dataEncryptionKey, authConfig });
}

/** @deprecated Use [[ThumbnailService.upload]] */
export function encryptAndUploadThumbnail({
  thumbnail,
  binaryId,
  attachmentDek,
  sizeType,
  authConfig,
  vaultUrl,
}: {
  thumbnail: Uint8Array;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: Common.ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}): Promise<Thumbnail> {
  const service = new ThumbnailService(vaultUrl);
  return service.upload({
    thumbnail: { data: thumbnail, sizeType },
    attachmentId: binaryId,
    key: attachmentDek,
    authConfig,
  });
}

/** @deprecated Use [[uploadAttachment]] */
export function fileUploadBrowser({
  file,
  vaultUrl,
  authConfig,
  videoCodec,
  progressUpdateFunc,
  onCancel,
}: {
  file: File;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  videoCodec?: string;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null;
  onCancel?: any;
}): Promise<{ attachment: DirectAttachment; dek: EncryptionKey }> {
  const service = new Latest.AttachmentService(vaultUrl);
  return service.upload({ file, authConfig, videoCodec, progressUpdateFunc, onCancel });
}

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
} = Latest.withCancel(fileUploadBrowser);

/** @deprecated Use [[downloadAttachment]] */
export function fileDownloadBrowser({
  attachmentId,
  dek,
  vaultUrl,
  authConfig,
  progressUpdateFunc,
  onCancel,
}: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}): Promise<File> {
  const service = new Latest.AttachmentService(vaultUrl);
  return service.download({ attachmentId, dek, authConfig, progressUpdateFunc, onCancel });
}

export const fileDownloadBrowserWithCancel: (_: {
  attachmentId: string;
  dek: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number, videoCodec?: string) => void)
    | null;
  onCancel?: any;
}) => { cancel: () => void; success: Promise<File> } = Latest.withCancel(fileDownloadBrowser);

import { EncryptionKey } from '@meeco/cryppo';
import { IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { DirectAttachment, ThumbnailResponse } from '@meeco/vault-api-sdk';

import * as Common from '@meeco/file-storage-common';
import * as Latest from './index';

// Fix v 3.1.2 interface:

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';

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
  fetchApi,
}: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  fetchApi?: any;
}) => Promise<Uint8Array> = Common.downloadThumbnail;

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

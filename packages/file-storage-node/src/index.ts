import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { IFileStorageAuthConfiguration, ThumbnailType } from '@meeco/file-storage-common';
import { AttachmentDirectDownloadUrl, ThumbnailResponse } from '@meeco/vault-api-sdk';
import { ThumbnailService } from './thumbnail-service';
import { AttachmentService } from './attachment-service';

/**
 * API v4.0.0
 * Deprecations will be removed in v.5.0.0 release
 */

export { ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-common';

export const thumbSizeTypeToMimeExt: (
  sizeTypeString: Common.ThumbnailType | string
) => {
  mimeType: string;
  fileExtension: string;
} = Common.thumbSizeTypeToMimeExt;

export * from './thumbnail-service';
export * from './attachment-service';

/** @deprecated Use [[AttachmentService.upload]] */
export function largeFileUploadNode(
  filePath: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration
): Promise<{ attachment: any; dek: EncryptionKey }> {
  const service = new AttachmentService(environment.vault.url);
  const dek = EncryptionKey.generateRandom();
  return service.upload({ filePath, authConfig, key: dek }).then(res => ({ attachment: res, dek }));
}

/** @deprecated Use [[AttachmentService.download]] */
export function fileDownloadNode(
  attachmentId: string,
  environment: {
    vault: {
      url: string;
    };
  },
  authConfig: IFileStorageAuthConfiguration,
  attachmentDek: EncryptionKey,
  logFunction?: any
): Promise<{ fileName: string; buffer: Buffer }> {
  const service = new AttachmentService(environment.vault.url);
  return service
    .download({ id: attachmentId, key: attachmentDek, authConfig })
    .then(res => ({ fileName: res.info.filename, buffer: res.data }));
}

/** @deprecated Use [[AttachmentService.download]] */
export function largeFileDownloadNode(
  attachmentID: string,
  dek: EncryptionKey,
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: string
): Promise<{ byteArray: Buffer; direct_download: AttachmentDirectDownloadUrl }> {
  const service = new AttachmentService(vaultUrl);
  return service
    .download({ id: attachmentID, key: dek, authConfig })
    .then(res => ({ direct_download: res.info, byteArray: res.data }));
}

/** @deprecated Use [[ThumbnailService.upload]] */
export function encryptAndUploadThumbnail(args: {
  thumbnailFilePath: string;
  binaryId: string;
  attachmentDek: EncryptionKey;
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
}): Promise<ThumbnailResponse> {
  const service = new ThumbnailService(args.vaultUrl);
  return service
    .upload({
      thumbnailFilePath: args.thumbnailFilePath,
      attachmentId: args.binaryId,
      key: args.attachmentDek,
      sizeType: args.sizeType,
      authConfig: args.authConfig,
    })
    .then(res => ({
      thumbnail: res,
    }));
}

/** @deprecated Use [[ThumbnailService.download]] */
export function downloadThumbnail(args: {
  id: string;
  dataEncryptionKey: EncryptionKey;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
}): Promise<Uint8Array> {
  const service = new ThumbnailService(args.vaultUrl);
  return service
    .download({
      id: args.id,
      key: args.dataEncryptionKey,
      authConfig: args.authConfig,
    })
    .then(res => Uint8Array.from(res));
}

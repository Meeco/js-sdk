import {
  binaryStringToBytesBuffer,
  bytesBufferToBinaryString,
  CipherStrategy,
  decryptWithKey,
  EncryptionKey,
  encryptWithKey,
} from '@meeco/cryppo';
import {
  AttachmentApi,
  AttachmentDirectUploadUrl,
  DirectAttachment,
  DirectAttachmentsApi,
  ThumbnailApi,
} from '@meeco/vault-api-sdk';
import axios from 'axios';
import { buildApiConfig, getBlobHeaders, getHeaders, IFileStorageAuthConfiguration } from './auth';
import { AzureBlockUpload } from './azure-block-upload';

export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export { BlobStorage } from './services/Azure';
export { IFileStorageAuthConfiguration, buildApiConfig };

/**
 *
 * @param encrypt If true and an `attachmentDek` is given, the file will be encrypted with the given key.
 * @param fileUtilsLib Module that has getSize, getType, readBlock functions. Defined in file-storage-browser or node packages.
 * @param progressUpdateFunc
 * @param onCancel Optional Promise that, if resolved, cancels the action. For example, used to implement a cancel button.
 */
export async function directAttachmentUpload(
  { directUploadUrl, file, encrypt, attachmentDek }: IDirectAttachmentUploadData,
  fileUtilsLib,
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null,
  onCancel?: any
): Promise<IDirectAttachmentUploadResponse> {
  let result: Promise<IDirectAttachmentUploadResponse>;

  const client = new AzureBlockUpload(
    directUploadUrl,
    file,
    {
      simultaneousUploads: 1,
      callbacks: {
        onProgress: progress => {},
        onSuccess: success => {
          result = success;
        },
        onError: error => {
          throw error;
        },
      },
    },
    fileUtilsLib
  );

  await client.start(encrypt && attachmentDek ? attachmentDek : null, progressUpdateFunc, onCancel);

  return result!;
}

/**
 * Create a new upload URL for the file specified by [[config]].
 */
export async function createAttachmentUploadUrl(
  config: {
    fileName: string;
    fileType: string;
    fileSize: number;
  },
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Promise<AttachmentDirectUploadUrl> {
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  const uploadUrl = await api.directAttachmentsUploadUrlPost({
    blob: {
      filename: config.fileName,
      content_type: config.fileType,
      byte_size: config.fileSize,
    },
  });
  return uploadUrl.attachment_direct_upload_url;
}

/**
 *
 * @param blobId
 * @param blobKey
 * @param artifactsBlobId
 * @param artifactsBlobKey
 */
export async function directAttachmentAttach(
  config: {
    blobId: number;
    blobKey: string;
    artifactsBlobId: number;
    artifactsBlobKey: string;
  },
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Promise<DirectAttachment> {
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  const attachment = await api.directAttachmentsPost({
    blob: {
      blob_id: config.blobId,
      blob_key: config.blobKey,
      encrypted_artifact_blob_id: config.artifactsBlobId,
      encrypted_artifact_blob_key: config.artifactsBlobKey,
    },
  });
  return attachment.attachment;
}

/**
 * Get meta-data about the attachment with [[id]]. Includes file name, type and user id of the
 * attachment's creator.
 */
export async function getAttachmentInfo(
  id: string,
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Promise<DirectAttachment> {
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  return api.directAttachmentsIdGet(id).then(response => response.attachment);
}

export async function downloadAttachment(
  id: string,
  dek: EncryptionKey,
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
) {
  return downloadAndDecryptFile(
    () => new AttachmentApi(buildApiConfig(auth, vaultUrl, fetchApi)).attachmentsIdDownloadGet(id),
    dek
  );
}

export async function downloadAndDecryptFile<T extends Blob>(
  download: () => Promise<T>,
  dataEncryptionKey: EncryptionKey
) {
  const result = await download();
  // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
  // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer
  const buffer = await ((<any>result).arrayBuffer
    ? (<any>result).arrayBuffer()
    : new Response(result).arrayBuffer());
  const encryptedContents = await bytesBufferToBinaryString(buffer);
  const decryptedContents = await decryptWithKey({
    serialized: encryptedContents,
    key: dataEncryptionKey,
  });
  return decryptedContents;
}

/* ---------- Thumbnails ---------- */

/**
 *
 * @param {object} __namedParameters Options
 * @param thumbnail
 * @param binaryId TODO:
 * @param attachmentDek
 * @param sizeType
 * @param authConfig
 * @param vaultUrl
 * @param fetchApi
 */
export async function uploadThumbnail({
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
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
  fetchApi?: any;
}) {
  const encryptedThumbnail = await encryptWithKey({
    key: attachmentDek,
    data: thumbnail,
    strategy: CipherStrategy.AES_GCM,
  });

  if (!encryptedThumbnail.serialized) {
    throw new Error('Error encrypting thumbnail file');
  }
  const blob =
    typeof Blob === 'function'
      ? new Blob([encryptedThumbnail.serialized])
      : binaryStringToBytesBuffer(encryptedThumbnail.serialized);
  const response = await new ThumbnailApi(
    buildApiConfig(authConfig, vaultUrl, fetchApi)
  ).thumbnailsPost(blob as any, binaryId, sizeType);

  return response;
}

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
  const res = await thumbnailsIdGet(authConfig, vaultUrl, id);
  const result = await thumbnailDownload(authConfig, res.data.redirect_url);
  // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
  // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer

  const decryptedContents = await decryptWithKey({
    serialized: result.data,
    key: dataEncryptionKey,
  });
  if (!decryptedContents) {
    throw new Error('Error decrypting thumbnail file');
  }
  return decryptedContents;
}

/**
 * Convert a string like "128x128/jpg" to mimeType + file extension, e.g. "image/jpg" and "jpg".
 */
export function thumbSizeTypeToMimeExt(
  sizeTypeString: ThumbnailType | string
): { mimeType: string; fileExtension: string } {
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

interface IDirectAttachmentUploadData {
  directUploadUrl: string;
  file: File | string;
  encrypt: boolean;
  attachmentDek?: EncryptionKey;
}

interface IDirectAttachmentUploadResponse {
  artifacts: {
    iv: Buffer[];
    ad: string;
    at: Buffer[];
    encryption_strategy: string;
    range: string[];
  };
}

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

async function thumbnailsIdGet(
  authConfig: IFileStorageAuthConfiguration,
  vaultUrl: any,
  id: string
) {
  const url = vaultUrl + '/thumbnails/' + id;
  const headers = getHeaders(authConfig);
  return axios({
    method: 'get',
    url,
    headers,
  });
}

async function thumbnailDownload(authConfig: IFileStorageAuthConfiguration, url: string) {
  return axios({
    method: 'get',
    url,
    headers: getBlobHeaders(authConfig),
  });
}

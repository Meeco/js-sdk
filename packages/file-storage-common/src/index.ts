import {
  binaryBufferToString,
  CipherStrategy,
  decryptBinaryWithKey,
  decryptWithKey,
  encryptBinaryWithKey,
  stringAsBinaryBuffer,
} from '@meeco/cryppo';
import {
  AttachmentApi,
  AttachmentDirectUploadUrlResponse,
  Configuration,
  ConfigurationParameters,
  CreateAttachmentResponse,
  DirectAttachmentsApi,
  PostAttachmentDirectUploadUrlRequest,
  ThumbnailApi,
} from '@meeco/vault-api-sdk';
import axios from 'axios';
import { AzureBlockUpload } from './azure-block-upload';
export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export { BlobStorage } from './services/Azure';

export interface IFileStorageAuthConfiguration {
  data_encryption_key?: string;
  vault_access_token: string;
  delegation_id?: string;
  subscription_key?: string;
}

export async function directAttachmentUpload(
  config: IDirectAttachmentUploadData,
  fileUtilsLib,
  progressUpdateFunc?:
    | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
    | null
): Promise<IDirectAttachmentUploadResponse> {
  let result;
  const client = new AzureBlockUpload(
    config.directUploadUrl,
    config.file,
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
  await client.start(
    config.encrypt && config.attachmentDek ? config.attachmentDek : null,
    progressUpdateFunc
  );

  return result;
}

export async function directAttachmentUploadUrl(
  config: IDirectAttachmentUploadUrlData,
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Promise<AttachmentDirectUploadUrlResponse> {
  let uploadUrl;
  try {
    const params: PostAttachmentDirectUploadUrlRequest = {
      blob: {
        filename: config.fileName,
        content_type: config.fileType,
        byte_size: config.fileSize,
      },
    };
    const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));

    uploadUrl = await api.directAttachmentsUploadUrlPost(params);
  } catch (err) {
    throw err;
  }
  return uploadUrl;
}

export async function directAttachmentAttach(
  config: IDirectAttachmentAttachData,
  auth: IFileStorageAuthConfiguration,
  vaultUrl,
  fetchApi?: any
): Promise<CreateAttachmentResponse> {
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  const attachment = await api.directAttachmentsPost({
    blob: {
      blob_id: config.blobId,
      blob_key: config.blobKey,
      encrypted_artifact_blob_id: config.artifactsBlobId,
      encrypted_artifact_blob_key: config.artifactsBlobKey,
    },
  });
  return attachment;
}

export async function getDirectAttachmentInfo(
  config: { attachmentId: string },
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Promise<any> {
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  return await api.directAttachmentsIdGet(config.attachmentId);
}

export async function downloadAttachment(
  id: string,
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
) {
  if (!auth.data_encryption_key) {
    // this file must have been uploaded with the old form of file upload which needs the user's private DEK
    throw new Error('auth.data_encryption_key is needed to download this particular file');
  }
  return downloadAndDecryptFile(
    () => new AttachmentApi(buildApiConfig(auth, vaultUrl, fetchApi)).attachmentsIdDownloadGet(id),
    auth.data_encryption_key
  );
}

export async function downloadAndDecryptFile<T extends Blob>(
  download: () => Promise<T>,
  dataEncryptionKey: string
) {
  const result = await download();
  // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
  // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer
  const buffer = await ((<any>result).arrayBuffer
    ? (<any>result).arrayBuffer()
    : new Response(result).arrayBuffer());
  const encryptedContents = await binaryBufferToString(buffer);
  const decryptedContents = await decryptWithKey({
    serialized: encryptedContents,
    key: dataEncryptionKey,
  });
  return decryptedContents;
}

export function buildApiConfig(
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Configuration {
  const headers = getHeaders(auth);

  const configParams: ConfigurationParameters = {
    basePath: vaultUrl,
    headers    
  };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }  
  return new Configuration(configParams);
}

function getHeaders(auth: IFileStorageAuthConfiguration) {
  const headers = {};
  headers['Meeco-Delegation-Id'] = auth.delegation_id || '';
  headers['Meeco-Subscription-Key'] = auth.subscription_key || '';
  headers['Authorization'] = auth.vault_access_token || '';
  return headers;
}

export async function encryptAndUploadThumbnailCommon({
  thumbnailBufferString,
  binaryId,
  attachmentDek,
  sizeType,
  authConfig,
  vaultUrl,
  fetchApi,
}: {
  thumbnailBufferString: string;
  binaryId: string;
  attachmentDek: string;
  sizeType: ThumbnailType;
  authConfig: IFileStorageAuthConfiguration;
  vaultUrl: string;
  fetchApi?: any;
}) {
  const encryptedThumbnail = await encryptBinaryWithKey({
    key: attachmentDek,
    data: thumbnailBufferString,
    strategy: CipherStrategy.AES_GCM,
  });

  if (!encryptedThumbnail.serialized) {
    throw new Error('Error encrypting thumbnail file');
  }
  const blob =
    typeof Blob === 'function'
      ? new Blob([encryptedThumbnail.serialized])
      : stringAsBinaryBuffer(encryptedThumbnail.serialized);
  const response = await new ThumbnailApi(
    buildApiConfig(authConfig, vaultUrl, fetchApi)
  ).thumbnailsPost(blob as any, binaryId, sizeType);

  return response;
}

export async function downloadThumbnailCommon({
  id,
  dataEncryptionKey,
  vaultUrl,
  authConfig,
  fetchApi,
}: {
  id: string;
  dataEncryptionKey: string;
  vaultUrl: string;
  authConfig: IFileStorageAuthConfiguration;
  fetchApi?: any;
}) {
  // const thumbnailApi = await new ThumbnailApi(buildApiConfig(authConfig, vaultUrl, fetchApi));
  const res = await thumbnailsIdGet(authConfig, vaultUrl, id);
  const result  = await thumbnailDownload(res.data.redirect_url)
  // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
  // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer  
  const buffer = await ((<any>result).arrayBuffer
    ? (<any>result).arrayBuffer()
    : new Response(result.data).arrayBuffer());
  const encryptedContents = await binaryBufferToString(buffer);
  const decryptedContents = await decryptBinaryWithKey({
    serialized: encryptedContents,
    key: dataEncryptionKey,
  });
  if (!decryptedContents) {
    throw new Error('Error decrypting thumbnail file');
  }
  return stringAsBinaryBuffer(decryptedContents);
}

export function thumbSizeTypeToMimeExt(
  sizeTypeString
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
  attachmentDek?: string;
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

export interface IDirectAttachmentUploadUrlData {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface IDirectAttachmentAttachData {
  blobId: number;
  blobKey: string;
  artifactsBlobId: number;
  artifactsBlobKey: string;
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

export const thumbnailsIdGet = async (authConfig: IFileStorageAuthConfiguration, vaultUrl: any, id: string) => {
  const url = vaultUrl + '/thumbnails/' + id;
  console.log(url);
  const headers = getHeaders(authConfig);
  return axios({
    method: 'get',
    url,
    headers
  }).then(result => {
    return result;
  });
};

export const thumbnailDownload = async (url: string) => {
  return axios({
    method: 'get',
    url    
  }).then(result => {
    return result;
  });
};
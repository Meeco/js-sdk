import * as Cryppo from '@meeco/cryppo';
import {
  AttachmentApi,
  AttachmentDirectUploadUrlResponse,
  Configuration,
  ConfigurationParameters,
  CreateAttachmentResponse,
  DirectAttachmentsApi,
  PostAttachmentDirectUploadUrlRequest,
} from '@meeco/vault-api-sdk';
import { AzureBlockUpload } from './azure-block-upload';
export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export { BlobStorage } from './services/Azure';

export interface IFileStorageAuthConfiguration {
  data_encryption_key: string;
  vault_access_token: string;
  delegate_id?: string;
}

export async function directAttachmentUpload(
  config: IDirectAttachmentUploadData,
  auth: IFileStorageAuthConfiguration,
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
  await client.start(config.encrypt ? auth.data_encryption_key : null, progressUpdateFunc);

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
  const headers = auth.delegate_id ? { 'Meeco-Delegate-Id': auth.delegate_id } : undefined;
  const configParams: ConfigurationParameters = {
    basePath: vaultUrl,
    apiKey: auth.vault_access_token,
    headers,
  };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }
  const api = new DirectAttachmentsApi(buildApiConfig(auth, vaultUrl, fetchApi));
  return await api.directAttachmentsIdGet(config.attachmentId);
}

export async function downloadAttachment(
  id: string,
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
) {
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
  const buffer = await (<any>result).arrayBuffer();
  const encryptedContents = await Cryppo.binaryBufferToString(buffer);
  const decryptedContents = await Cryppo.decryptWithKey({
    serialized: encryptedContents,
    key: dataEncryptionKey,
  });
  return decryptedContents;
}

function buildApiConfig(
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Configuration {
  const headers = auth.delegate_id ? { 'Meeco-Delegate-Id': auth.delegate_id } : undefined;
  const configParams: ConfigurationParameters = {
    basePath: vaultUrl,
    apiKey: auth.vault_access_token,
    headers,
  };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }
  return new Configuration(configParams);
}

interface IDirectAttachmentUploadData {
  directUploadUrl: string;
  file: File | string;
  options: any;
  encrypt: boolean;
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

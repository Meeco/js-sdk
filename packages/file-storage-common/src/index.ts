import * as Cryppo from '@meeco/cryppo';
import {
  AttachmentApi,
  AttachmentDirectUploadUrlResponse,
  Configuration,
  CreateAttachmentResponse,
  DirectAttachmentsApi,
  PostAttachmentDirectUploadUrlRequest,
} from '@meeco/vault-api-sdk';
import { AzureBlockUpload } from './azure-block-upload';
export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export { BlobStorage } from './services/Azure';

export async function directAttachmentUpload(
  config: IDirectAttachmentUploadData,
  auth: {
    data_encryption_key: string;
    vault_access_token: string;
  },
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
  auth: {
    data_encryption_key: string;
    vault_access_token: string;
  },
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
    const configParams = { basePath: vaultUrl, apiKey: auth.vault_access_token };
    if (fetchApi) {
      configParams['fetchApi'] = fetchApi;
    }
    const api = new DirectAttachmentsApi(new Configuration(configParams));

    uploadUrl = await api.directAttachmentsUploadUrlPost(params);
  } catch (err) {
    throw err;
  }
  return uploadUrl;
}

export async function directAttachmentAttach(
  config: IDirectAttachmentAttachData,
  auth: {
    data_encryption_key: string;
    vault_access_token: string;
  },
  vaultUrl,
  fetchApi?: any
): Promise<CreateAttachmentResponse> {
  const configParams = { basePath: vaultUrl, apiKey: auth.vault_access_token };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }
  const api = new DirectAttachmentsApi(new Configuration(configParams));
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
  auth: {
    data_encryption_key: string;
    vault_access_token: string;
  },
  vaultUrl: string,
  fetchApi?: any
): Promise<any> {
  const configParams = { basePath: vaultUrl, apiKey: auth.vault_access_token };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }
  const api = new DirectAttachmentsApi(new Configuration(configParams));
  return await api.directAttachmentsIdGet(config.attachmentId);
}

export async function downloadAttachment(
  id: string,
  vaultAccessToken: string,
  dataEncryptionKey: string,
  vaultUrl: string
) {
  return downloadAndDecryptFile(
    () =>
      new AttachmentApi(
        new Configuration({ basePath: vaultUrl, apiKey: vaultAccessToken })
      ).attachmentsIdDownloadGet(id),
    dataEncryptionKey
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
    encryption_stratergy: string;
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

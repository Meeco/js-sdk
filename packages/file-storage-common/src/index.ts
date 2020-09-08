import { AuthData } from '@meeco/sdk';
import {
  AttachmentDirectUploadUrlResponse,
  Configuration,
  CreateAttachmentResponse,
  DirectAttachmentsApi,
  PostAttachmentDirectUploadUrlRequest
} from '@meeco/vault-api-sdk';
import { AzureBlockUpload } from './azure-block-upload';
export function exampleFunction() {
  console.log('example function ran');
  return 'example function ran';
}

export { Environment, ItemService } from '@meeco/sdk';
export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export { BlobStorage } from './services/Azure';

export async function directAttachmentUpload(
  config: IDirectAttachmentUploadData,
  auth: AuthData
): Promise<IDirectAttachmentUploadResponse> {
  let result;
  const client = new AzureBlockUpload(config.directUploadUrl, config.file, {
    simultaneousUploads: 1,
    callbacks: {
      onProgress: progress => {},
      onSuccess: success => {
        result = success;
      },
      onError: error => {
        throw error;
      }
    }
  });
  await client.start(config.encrypt ? auth.data_encryption_key['_value'] : null);

  return result;
}

export async function directAttachmentUploadUrl(
  config: IDirectAttachmentUploadUrlData,
  auth: AuthData,
  vaultUrl: string
): Promise<AttachmentDirectUploadUrlResponse> {
  let uploadUrl;
  try {
    const params: PostAttachmentDirectUploadUrlRequest = {
      blob: {
        filename: config.fileName,
        content_type: config.fileType,
        byte_size: config.fileSize
      }
    };
    const api = new DirectAttachmentsApi(
      new Configuration({ basePath: vaultUrl, apiKey: auth.vault_access_token })
    );

    uploadUrl = await api.directAttachmentsUploadUrlPost(params);
  } catch (err) {
    throw err;
  }
  return uploadUrl;
}

export async function directAttachmentAttach(
  config: IDirectAttachmentAttachData,
  auth: AuthData,
  vaultUrl
): Promise<CreateAttachmentResponse> {
  const api = new DirectAttachmentsApi(
    new Configuration({ basePath: vaultUrl, apiKey: auth.vault_access_token })
  );
  const attachment = await api.directAttachmentsPost({
    blob: {
      blob_id: config.blobId,
      blob_key: config.blobKey,
      encrypted_artifact_blob_id: config.artifactsBlobId,
      encrypted_artifact_blob_key: config.artifactsBlobKey
    }
  });
  return attachment;
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

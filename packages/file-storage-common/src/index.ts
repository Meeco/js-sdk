import * as Cryppo from '@meeco/cryppo';
import {
  AttachmentApi,
  AttachmentDirectUploadUrlResponse,
  Configuration,
  CreateAttachmentResponse,
  DirectAttachmentsApi,
  PostAttachmentDirectUploadUrlRequest,
} from '@meeco/vault-api-sdk';
import { AuthData } from './auth-data';
import { AzureBlockUpload } from './azure-block-upload';
import { EncryptionKey } from './encryption-key';
export * from './auth-data';
export { AzureBlockDownload } from './azure-block-download';
export { AzureBlockUpload } from './azure-block-upload';
export * from './encryption-key';
export { BlobStorage } from './services/Azure';

export async function directAttachmentUpload(
  config: IDirectAttachmentUploadData,
  auth: AuthData,
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
    config.encrypt ? auth.data_encryption_key['_value'] : null,
    progressUpdateFunc
  );

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
        byte_size: config.fileSize,
      },
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
      encrypted_artifact_blob_key: config.artifactsBlobKey,
    },
  });
  return attachment;
}

export async function getDirectAttachmentInfo(
  config: { attachmentId: string },
  auth: AuthData,
  vaultUrl: string
): Promise<any> {
  const api = new DirectAttachmentsApi(
    new Configuration({ basePath: vaultUrl, apiKey: auth.vault_access_token })
  );
  return await api.directAttachmentsIdGet(config.attachmentId);
}

export async function downloadAttachment(
  id: string,
  vaultAccessToken: string,
  dataEncryptionKey: EncryptionKey,
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
  dataEncryptionKey: EncryptionKey
) {
  const result = await download();
  const buffer = await (<any>result).arrayBuffer();
  const encryptedContents = await Cryppo.binaryBufferToString(buffer);
  const decryptedContents = await Cryppo.decryptWithKey({
    serialized: encryptedContents,
    key: dataEncryptionKey.key,
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

interface IAPIConfig {
  url: string;
  subscription_key: string;
}

/**
 * Environment configuration - used to point to the desired API host (e.g sandbox or production) and configure
 * your subscription keys for API access.
 */
export class Environment {
  public vault: IAPIConfig;
  public keystore: IAPIConfig;

  constructor(config: {
    vault: IAPIConfig;
    keystore: IAPIConfig & { provider_api_key: string }; // TODO: check if this one is still needed
  }) {
    this.vault = config.vault;
    this.keystore = config.keystore;
  }
}

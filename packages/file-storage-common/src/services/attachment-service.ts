import { EncryptionKey } from '@meeco/cryppo';
import {
  AttachmentDirectDownloadUrl,
  AttachmentDirectUploadUrl,
  DirectAttachment,
  DirectAttachmentsApi,
} from '@meeco/vault-api-sdk';
import { buildApiConfig, IFileStorageAuthConfiguration } from '../auth';
import { AzureBlockUpload } from '../azure-block-upload';

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

export class AttachmentService {
  constructor(protected vaultUrl: string, protected fetchApi?: any) {}

  /**
   * @param encrypt If true and an `attachmentDek` is given, the file will be encrypted with the given key.
   * @param fileUtilsLib Module that has getSize, getType, readBlock functions. Defined in file-storage-browser or node packages.
   * @param progressUpdateFunc
   * @param onCancel Optional Promise that, if resolved, cancels the action. For example, used to implement a cancel button.
   */
  protected async uploadBlocks(
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

    await client.start(
      encrypt && attachmentDek ? attachmentDek : null,
      progressUpdateFunc,
      onCancel
    );

    return result!;
  }

  /**
   * Create a new upload URL for the file specified by [[config]].
   */
  async createUploadUrl(
    config: {
      fileName: string;
      fileType: string;
      fileSize: number;
    },
    auth: IFileStorageAuthConfiguration
  ): Promise<AttachmentDirectUploadUrl> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));
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
   * Store a link between id and keys of an attachment and its encryption artifacts.
   */
  protected async linkArtifacts(
    file: {
      blobId: number;
      blobKey: string;
    },
    artifacts: {
      blobId: number;
      blobKey: string;
    },
    auth: IFileStorageAuthConfiguration
  ): Promise<DirectAttachment> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));
    const attachment = await api.directAttachmentsPost({
      blob: {
        blob_id: file.blobId,
        blob_key: file.blobKey,
        encrypted_artifact_blob_id: artifacts.blobId,
        encrypted_artifact_blob_key: artifacts.blobKey,
      },
    });
    return attachment.attachment;
  }

  /**
   * Get meta-data about the attachment with [[id]]. Includes file name, type and user id of the
   * attachment's creator.
   */
  async getAttachmentInfo(
    id: string,
    auth: IFileStorageAuthConfiguration
  ): Promise<DirectAttachment> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));
    return api.directAttachmentsIdGet(id).then(response => response.attachment);
  }

  /**
   * @param id Attachment Id.
   * @returns Azure block storage URL for encryption metadata file `artifactsUrl` and
   * Azure Url data for binary attachment `fileInfo`.
   */
  protected async getDownloadMetaData(
    id: string,
    auth: IFileStorageAuthConfiguration
  ): Promise<{ artifactsUrl: string; fileInfo: AttachmentDirectDownloadUrl }> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));

    try {
      const {
        attachment_direct_download_url: { url: artifactsUrl },
      } = await api.directAttachmentsIdDownloadUrlGet(id, 'encryption_artifact_file');

      const {
        attachment_direct_download_url: attachmentInfo,
      } = await api.directAttachmentsIdDownloadUrlGet(id, 'binary_file');

      return { artifactsUrl, fileInfo: attachmentInfo };
    } catch (e) {
      throw new Error('Could not retrieve ' + id);
    }
  }
}

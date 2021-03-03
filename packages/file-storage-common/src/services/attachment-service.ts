import { bytesBufferToBinaryString, decryptWithKey, EncryptionKey } from '@meeco/cryppo';
import {
  AttachmentApi,
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
  constructor(private vaultUrl: string, private fetchApi?: any) {}

  /**
   *
   * @param encrypt If true and an `attachmentDek` is given, the file will be encrypted with the given key.
   * @param fileUtilsLib Module that has getSize, getType, readBlock functions. Defined in file-storage-browser or node packages.
   * @param progressUpdateFunc
   * @param onCancel Optional Promise that, if resolved, cancels the action. For example, used to implement a cancel button.
   */
  async directAttachmentUpload(
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
  async createAttachmentUploadUrl(
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
   *
   * @param blobId
   * @param blobKey
   * @param artifactsBlobId
   * @param artifactsBlobKey
   */
  async directAttachmentAttach(
    config: {
      blobId: number;
      blobKey: string;
      artifactsBlobId: number;
      artifactsBlobKey: string;
    },
    auth: IFileStorageAuthConfiguration
  ): Promise<DirectAttachment> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));
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
  async getAttachmentInfo(
    id: string,
    auth: IFileStorageAuthConfiguration
  ): Promise<DirectAttachment> {
    const api = new DirectAttachmentsApi(buildApiConfig(auth, this.vaultUrl, this.fetchApi));
    return api.directAttachmentsIdGet(id).then(response => response.attachment);
  }

  async downloadAttachment(id: string, dek: EncryptionKey, auth: IFileStorageAuthConfiguration) {
    return this.downloadAndDecryptFile(
      () =>
        new AttachmentApi(
          buildApiConfig(auth, this.vaultUrl, this.fetchApi)
        ).attachmentsIdDownloadGet(id),
      dek
    );
  }

  async downloadAndDecryptFile<T extends Blob>(
    download: () => Promise<T>,
    dataEncryptionKey: EncryptionKey
  ) {
    const result = await download();
    // Chrome `Blob` objects support the arrayBuffer() methods but Safari do not - only on `Response`
    // https://stackoverflow.com/questions/15341912/how-to-go-from-blob-to-arraybuffer
    const buffer = await ((<any>result).arrayBuffer
      ? (<any>result).arrayBuffer()
      : new Response(result).arrayBuffer());
    const encryptedContents = bytesBufferToBinaryString(buffer);
    const decryptedContents = await decryptWithKey({
      serialized: encryptedContents,
      key: dataEncryptionKey,
    });
    return decryptedContents;
  }
}

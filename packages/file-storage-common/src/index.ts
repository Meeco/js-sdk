import { AuthData } from '@meeco/sdk';
import { AzureBlockUpload } from './azure-block-upload';
export function exampleFunction() {
  console.log('example function ran');
  return 'example function ran';
}

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

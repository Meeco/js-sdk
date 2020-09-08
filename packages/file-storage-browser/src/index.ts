import {
  directAttachmentAttach,
  directAttachmentUpload,
  directAttachmentUploadUrl
} from '@meeco/file-storage-common';
import { AuthData, EncryptionKey } from '@meeco/sdk';
export { Environment } from '@meeco/sdk';
// export class AuthData {
//   public data_encryption_key: EncryptionKey;
//   public key_encryption_key: EncryptionKey;
//   public keystore_access_token: string;
//   public passphrase_derived_key: EncryptionKey;
//   public secret: string;
//   public vault_access_token: string;

//   constructor(config: {
//     data_encryption_key: EncryptionKey;
//     key_encryption_key: EncryptionKey;
//     keystore_access_token: string;
//     passphrase_derived_key: EncryptionKey;
//     secret: string;
//     vault_access_token: string;
//   }) {
//     this.data_encryption_key = config.data_encryption_key;
//     this.key_encryption_key = config.key_encryption_key;
//     this.keystore_access_token = config.keystore_access_token;
//     this.passphrase_derived_key = config.passphrase_derived_key;
//     this.secret = config.secret;
//     this.vault_access_token = config.vault_access_token;
//   }
// }

export async function fileUploadBrowser(
  file: File,
  dek: string,
  vaultUrl: string,
  vaultAccessToken: string
): Promise<any> {
  const authConfig = new AuthData({
    data_encryption_key: EncryptionKey.fromSerialized(dek),
    key_encryption_key: EncryptionKey.fromRaw(''),
    keystore_access_token: '',
    passphrase_derived_key: EncryptionKey.fromRaw(''),
    secret: '',
    vault_access_token: vaultAccessToken
  });
  // const environment = new Environment({
  //   vault: {
  //     url: vaultUrl,
  //     subscription_key: ''
  //   },
  //   keystore: {
  //     url: '',
  //     subscription_key: '',
  //     provider_api_key: ''
  //   }
  // });
  const uploadUrl = await directAttachmentUploadUrl(
    {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    },
    authConfig,
    vaultUrl
  );
  const uploadResult = await directAttachmentUpload(
    {
      directUploadUrl: uploadUrl.url,
      file,
      encrypt: true,
      options: {}
    },
    authConfig
  );
  console.log(uploadResult);
  const artifactsFileName = file.name + '.encryption_artifacts';
  // const artifactsFileDir = `./tmp/${artifactsFileName}`;
  const artifactsFile = new File(
    [JSON.stringify(uploadResult.artifacts)],
    file.name + '.encryption_artifacts',
    {
      type: 'application/json'
    }
  );
  // const artifactsFileStats = fs.statSync(artifactsFileDir);
  const artifactsUploadUrl = await directAttachmentUploadUrl(
    {
      fileName: artifactsFileName,
      fileType: 'application/json',
      fileSize: artifactsFile.size
    },
    authConfig,
    vaultUrl
  );
  await directAttachmentUpload(
    {
      directUploadUrl: artifactsUploadUrl.url,
      file: artifactsFile,
      encrypt: false,
      options: {}
    },
    authConfig
  );
  const attachedDoc = await directAttachmentAttach(
    {
      blobId: uploadUrl.blob_id,
      blobKey: uploadUrl.blob_key,
      artifactsBlobId: artifactsUploadUrl.blob_id,
      artifactsBlobKey: artifactsUploadUrl.blob_key
    },
    authConfig,
    vaultUrl
  );
  return attachedDoc;
}

// export async function fileDownloadBrowser(
//   attachmentId: string,
//   environment: Environment,
//   authConfig: AuthData,
//   logFunction: any
// ): Promise<{ fileName: string; buffer: Buffer }> {
//   const service = new ItemService(environment, logFunction);

//   const attachmentInfo = await service.getDirectAttachmentInfo({ attachmentId }, authConfig);
//   let buffer: Buffer;
//   const fileName: string = attachmentInfo.attachment.filename;
//   if (attachmentInfo.attachment.is_direct_upload) {
//     // was uploaded in chunks
//     const downloaded = await largeFileDownloadBrowser(
//       attachmentId,
//       authConfig.data_encryption_key,
//       authConfig.vault_access_token,
//       environment.vault.url
//     );
//     buffer = downloaded.byteArray;
//   } else {
//     // was not uploaded in chunks
//     const downloaded = await service.downloadAttachment(
//       attachmentId,
//       authConfig.vault_access_token,
//       authConfig.data_encryption_key
//     );
//     buffer = Buffer.from(downloaded);
//   }
//   return { fileName, buffer };
// }

// export async function largeFileDownloadBrowser(attachmentID, dek, token, vaultUrl) {
//   const direct_download_encrypted_artifact = await getDirectDownloadInfo(
//     attachmentID,
//     'encryption_artifact_file',
//     token,
//     vaultUrl
//   );
//   const direct_download = await getDirectDownloadInfo(attachmentID, 'binary_file', token, vaultUrl);
//   let client = new AzureBlockDownload(direct_download_encrypted_artifact.url);
//   const encrypted_artifact_uint8array: any = await client.start(null, null, null, null);
//   const encrypted_artifact = JSON.parse(encrypted_artifact_uint8array.toString('utf-8'));
//   client = new AzureBlockDownload(direct_download.url);
//   const blocks: Buffer[] = [];

//   for (let index = 0; index < encrypted_artifact.range.length; index++) {
//     const block: any = await client.start(
//       dek,
//       encrypted_artifact.encryption_stratergy,
//       {
//         iv: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.iv[index].data)),
//         ad: encrypted_artifact.ad,
//         at: Cryppo.binaryBufferToString(new Uint8Array(encrypted_artifact.at[index].data))
//       },
//       encrypted_artifact.range[index]
//     );
//     blocks.push(block);
//   }
//   const byteArray = Buffer.concat(blocks);
//   return { byteArray, direct_download };
// }

// function getDirectDownloadInfo(id: string, type: string, token: string, vaultUrl: string) {
//   const options = {
//     headers: {
//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//       Authorization: 'Bearer ' + token
//     },
//     method: 'GET'
//   };

//   return fetch(`${vaultUrl}/direct/attachments/${id}/download_url?type=${type}`, options).then(
//     res => {
//       return res.json();
//     }
//   );
// }

import {
  binaryStringToBytes,
  bytesToBinaryString,
  CipherStrategy,
  decryptWithKeyUsingArtefacts,
  EncryptionKey,
} from '@meeco/cryppo';
import axios from 'axios';
import { getBlobHeaders, IFileStorageAuthConfiguration } from './auth';
import { BlobStorage } from './services/Azure';

// note that in sandbox APIM (https://sandbox.meeco.me/vault/blobs/ endpoint) needs subscription key header
// but then redirects to MS Azure which needs OIDC token

export class AzureBlockDownload {
  /**
   * @param oidcToken Mandatory OpenId Connect access token.
   * @param strategy Cryppo strategy, usually found in EncryptionArtifacts file.
   * @param encryptionArtifact Settings usually found in EncryptionArtifacts file.
   * @param range Optional range in bytes e.g 0-255.
   * @param userCancelable A Promise that cancels the download if resolved.
   */
  static async downloadAndDecrypt(
    url: string,
    authConfig: IFileStorageAuthConfiguration,
    dataEncryptionKey: EncryptionKey,
    strategy: CipherStrategy,
    encryptionArtifact: {
      iv: string;
      at: string;
      ad: string;
    },
    range?: string,
    userCancelable?: Promise<any>
  ): Promise<Uint8Array> {
    const data = await this.download(url, authConfig, range, userCancelable);

    const str = decryptWithKeyUsingArtefacts(
      dataEncryptionKey,
      bytesToBinaryString(data),
      strategy,
      encryptionArtifact
    );

    return new Uint8Array(str || binaryStringToBytes(''));
  }

  /**
   * @param oidcToken Mandatory OpenId Connect access token.
   * @param range Optional range in bytes e.g 0-255
   * @param userCancelable A Promise that cancels the download if resolved.
   */
  static async download(
    url: string,
    authConfig: IFileStorageAuthConfiguration,
    range?: string,
    userCancelable?: Promise<any>
  ): Promise<Uint8Array> {
    if (typeof url !== 'string') {
      throw new Error('url must be a string');
    }

    // Azure requires NO Authorization header
    const headers = getBlobHeaders(authConfig);

    let block: any;

    if (userCancelable) {
      const source = axios.CancelToken.source();
      const cancelToken = source.token;
      let userCanceled = false;
      block = await Promise.race([
        BlobStorage.getBlock(url, range, headers, cancelToken),
        userCancelable.then(() => (userCanceled = true)),
      ]);
      if (userCanceled) {
        source.cancel('cancel');
        return Promise.reject('cancel');
      }
    } else {
      block = await BlobStorage.getBlock(url, range, headers);
    }

    return new Uint8Array(block.data);
  }
}

import {
  binaryStringToBytes,
  bytesToBinaryString,
  CipherStrategy,
  decryptWithKeyUsingArtefacts,
  EncryptionKey,
} from '@meeco/cryppo';
import axios from 'axios';
import { BlobStorage } from './services/Azure';

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
    oidcToken: string,
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
    const data = await this.download(url, oidcToken, range, userCancelable);

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
    oidcToken: string,
    range?: string,
    userCancelable?: Promise<any>
  ): Promise<Uint8Array> {
    if (typeof url !== 'string') {
      throw new Error('url must be a string');
    }

    const header = {
      ['authorizationoidc2']: `Bearer ${oidcToken}`,
    };

    let block: any;

    if (userCancelable) {
      const source = axios.CancelToken.source();
      const cancelToken = source.token;
      let userCanceled = false;
      block = await Promise.race([
        BlobStorage.getBlock(url, range, header, cancelToken),
        userCancelable.then(() => (userCanceled = true)),
      ]);
      if (userCanceled) {
        source.cancel('cancel');
        return new Promise((_resolve, reject) => {
          reject('cancel');
        });
      }
    } else {
      block = await BlobStorage.getBlock(url, range, header);
    }

    return new Uint8Array(block.data);
  }
}

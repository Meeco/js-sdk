import {
  binaryBufferToString,
  CipherStrategy,
  decryptWithKeyUsingArtefacts,
  stringAsBinaryBuffer,
} from '@meeco/cryppo';
import axios from 'axios';
import { BlobStorage } from './services/Azure';

export class AzureBlockDownload {
  /**
   * @param {String} url Where to download the file
   *
   */
  url: any;
  constructor(url: string) {
    if (typeof url !== 'string') {
      throw new Error('url must be a string');
    }

    this.url = url;
  }

  /**
   * Start downloading
   */
  async start(
    dataEncryptionKey: string | null,
    strategy: CipherStrategy | null,
    encryptionArtifact: any,
    range: string | null,
    onCancel?: any
  ) {
    if (range) {
      let block: any;
      if (onCancel) {
        const source = axios.CancelToken.source();
        const cancelToken = source.token;
        block = await Promise.race([BlobStorage.getBlock(this.url, range, cancelToken), onCancel]);
        if (block === 'cancel') {
          source.cancel('cancel');
          return new Promise((_resolve, reject) => {
            reject('cancel');
          });
        }
      } else {
        block = await BlobStorage.getBlock(this.url, range);
      }

      const data = new Uint8Array(block.data);
      let byteNumbers: Uint8Array;
      if (dataEncryptionKey && strategy && encryptionArtifact) {
        const str = decryptWithKeyUsingArtefacts(
          dataEncryptionKey,
          binaryBufferToString(data),
          strategy,
          encryptionArtifact
        );

        byteNumbers = new Uint8Array(stringAsBinaryBuffer(str || ''));
      }
      return new Promise(resolve => {
        resolve(byteNumbers || data);
      });
    } else {
      const blob = await BlobStorage.getBlock(this.url, null);
      return new Promise(resolve => {
        resolve(blob.data);
      });
    }
  }
}

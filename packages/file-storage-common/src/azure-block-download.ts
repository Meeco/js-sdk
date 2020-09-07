import * as Cryppo from '@meeco/cryppo';
import { BlobStorage } from './services/Azure';

export class AzureBlockDownload {
  /**
   * @param {String} url Where to download the file
   *
   */
  url: any;
  constructor(url) {
    if (typeof url !== 'string') {
      throw new Error('url must be a string');
    }

    this.url = url;
  }

  /**
   * Start downloading
   */
  async start(dataEncryptionKey, strategy, encryptionArtifact, range) {
    if (range) {
      const block = await BlobStorage.getBlock(this.url, range);
      // Buffer.from(block.data, 'binary');

      // const fileBuffer: any = await FileUtils.readBlock(
      //   block.data,
      //   0,
      //   FileUtils.getSize(block.data)
      // );
      const data = new Uint8Array(block.data);
      // const data = Cryppo.stringAsBinaryBuffer(block.data);
      // const data = Buffer.from(block.data, 'binary');
      // const data = block.data;

      let byteNumbers: Uint8Array;
      if (dataEncryptionKey && strategy && encryptionArtifact) {
        const str = Cryppo.decryptWithKeyUsingArtefacts(
          dataEncryptionKey.key,
          Cryppo.binaryBufferToString(data),
          strategy,
          encryptionArtifact
        );
        // const str = data;

        byteNumbers = new Uint8Array(Cryppo.stringAsBinaryBuffer(str));
      }
      return new Promise(resolve => {
        resolve(byteNumbers || data);
      });
    } else {
      const blob = await BlobStorage.getBlock(this.url, null);
      // const fileBuffer: any = await FileUtils.readBlock(blob.data, 0, FileUtils.getSize(blob.data));
      // const data = new Uint8Array(fileBuffer);
      return new Promise(resolve => {
        resolve(blob.data);
      });
    }
  }
}

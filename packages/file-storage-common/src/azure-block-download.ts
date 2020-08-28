import * as Cryppo from '@meeco/cryppo';
import FileUtils from './FileUtils';
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
      //console.log("range: " + range);
      const block = await BlobStorage.getBlock(this.url, range);
      //console.log("block: " + block);
      //console.log("block data: " + block.data);
      //console.log("block data size : " + FileUtils.getSize(block.data));
      const fileBuffer: any = await FileUtils.readBlock(
        block.data,
        0,
        FileUtils.getSize(block.data)
      );
      const data = new Uint8Array(fileBuffer);
      // console.log("block data: " + data);
      // console.log("string version: " + Cryppo.binaryBufferToString(data));

      let byteNumbers: any[] = [];
      if (dataEncryptionKey && strategy && encryptionArtifact) {
        //console.log("key" + dataEncryptionKey);
        //console.log("encryption artifact" + JSON.stringify(encryptionArtifact));
        //console.log("strategy" + strategy);
        const str: any = Cryppo.decryptWithKeyUsingArtefacts(
          dataEncryptionKey,
          Cryppo.binaryBufferToString(data),
          strategy,
          encryptionArtifact
        );

        //console.log("str" + str);
        //console.log("string lenght" + str.length);

        for (let i = 0; i < str.length; i++) {
          byteNumbers.push(str.charCodeAt(i));
        }
        //console.log("byteNumber: " + byteNumbers);
      }
      return new Promise(resolve => {
        //console.log("resolve byteNumber: " + byteNumbers);
        resolve(byteNumbers || data);
      });
    } else {
      const blob = await BlobStorage.getBlock(this.url, null);
      const fileBuffer: any = await FileUtils.readBlock(blob.data, 0, FileUtils.getSize(blob.data));
      const data = new Uint8Array(fileBuffer);
      return new Promise(resolve => {
        resolve(data);
      });
    }
  }
}

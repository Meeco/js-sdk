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
      // const data = new Uint8Array(fileBuffer);
      const data = block.data;

      const byteNumbers: any[] = [];
      if (dataEncryptionKey && strategy && encryptionArtifact) {
        // const str = Cryppo.decryptWithKeyUsingArtefacts(
        //   dataEncryptionKey,
        //   data,
        //   strategy,
        //   encryptionArtifact
        // );
        const str = data;

        // for (let i = 0; i < str.length; i++) {
        //   byteNumbers.push(str.charCodeAt(i));
        // }
      }
      return new Promise(resolve => {
        resolve(/*byteNumbers || */ data);
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

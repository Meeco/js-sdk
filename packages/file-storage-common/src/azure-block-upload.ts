import {
  binaryStringToBytesBuffer,
  bytesBufferToBinaryString,
  CipherStrategy,
  EncryptionKey,
  encryptWithKeyUsingArtefacts,
  generateRandomBytesString,
} from '@meeco/cryppo';
import { isRunningOnWeb } from './app';
import { BlobStorage } from './services/Azure';
import ThreadPool from './ThreadPool';

const base64 = (str: string) =>
  isRunningOnWeb ? window.btoa(str) : Buffer.from(str).toString('base64');

export class AzureBlockUpload {
  /**
   * @param {String} url Where to send the file
   * @param {File} file The actual file
   * @param {Object} [opts] Options
   * @param {String} [opts.blockIDPrefix] Block ID Prefix
   * @param {Number} [opts.blockSize] Block size
   * @param {Object} [opts.callbacks] Callbacks
   * @param {Function} [opts.callbacks.onSuccess] Function to be called when the upload finishes
   * @param {Function} [opts.callbacks.onError] Function to be called when the upload fails
   * @param {Function} [opts.callbacks.onProgress] Function to be called every time
   * the progress changes
   * @param {Number} [opts.simultaneousUploads] Number of simultaneous uploads
   */

  url: any;
  file: any;
  blockSize: any;
  simultaneousUploads: any;
  blockIDPrefix: any;
  callbacks: any;
  fileSize: any;
  fileType: any;
  currentFilePointer: any;
  totalRemainingBytes: any;
  totalBlocks: any;
  fileUtilsLib: any;

  constructor(url: string, file: File | string, opts: any = {}, fileUtilsLib: any) {
    if (typeof url !== 'string') {
      throw new Error('url must be a string');
    }

    this.url = url;

    if (typeof File === 'function') {
      if (!(file instanceof File)) {
        throw new Error('file must be instance of File');
      }
    } else if (typeof file !== 'string') {
      throw new Error('file must be instance of string');
    }

    this.file = file;

    if (opts.blockSize && typeof opts.blockSize !== 'number') {
      throw new Error('blockSize must be a number');
    }

    this.blockSize = opts.blockSize || BlobStorage.BLOCK_MAX_SIZE;

    if (opts.simultaneousUploads && typeof opts.simultaneousUploads !== 'number') {
      throw new Error('simultaneousUploads must be a number');
    }

    this.simultaneousUploads = opts.simultaneousUploads || 3;

    this.blockIDPrefix = opts.blockIDPrefix || 'block';
    this.fileUtilsLib = fileUtilsLib;

    // Callbacks
    const {
      onProgress = () => null,
      onSuccess = () => null,
      onError = (err: string) => console.error(err),
    } = opts.callbacks || {};

    this.callbacks = {
      onProgress,
      onError,
      onSuccess,
    };

    this.analizeFile();
  }

  /**
   * Do the calculations for knowing how many blocks we are going to use
   */
  analizeFile() {
    /**
     * Size of file
     */
    this.fileSize = this.fileUtilsLib.getSize(this.file);

    /**
     * Type of file
     */
    this.fileType = this.fileUtilsLib.getType(this.file);

    /**
     * Indicates where in the file we are
     */
    this.currentFilePointer = 0;

    /**
     * Remaining bytes to send
     */
    this.totalRemainingBytes = this.fileSize;

    // If file is smaller than the block size, block size will be reduced to the file size
    if (this.fileSize < this.blockSize) {
      this.blockSize = this.fileSize;
    }

    /**
     * How many blocks we will send
     */
    this.totalBlocks =
      this.fileSize % this.blockSize === 0
        ? this.fileSize / this.blockSize
        : Math.ceil(this.fileSize / this.blockSize);
  }

  /**
   * Start uploading
   */

  async start(
    dataEncryptionKey: EncryptionKey | null,
    progressUpdateFunc?:
      | ((chunkBuffer: ArrayBuffer | null, percentageComplete: number) => void)
      | null,
    onCancel?: any
  ) {
    const p = new Promise<void>((resolve, reject) => {
      const blockIDList: any[] = [];
      const range: any[] = [];
      const iv: any[] = [];
      const at: any[] = [];
      const artifacts = {
        iv,
        ad: 'none',
        at,
        range,
        encryption_strategy: CipherStrategy.AES_GCM,
        size: this.fileSize,
      };

      const commit = async () => BlobStorage.putBlockList(this.url, blockIDList, this.fileType);

      const job = async (nBlock: any, cancel?: any) => {
        try {
          const from = nBlock * this.blockSize;
          const to =
            (nBlock + 1) * this.blockSize < this.fileSize
              ? (nBlock + 1) * this.blockSize
              : this.fileSize;

          const blockID: any = base64(`${this.blockIDPrefix}${nBlock.toString().padStart(5)}`);
          blockIDList.push(blockID);

          let blockBuffer: any;
          if (cancel) {
            blockBuffer = await Promise.race([
              this.fileUtilsLib.readBlock(this.file, from, to),
              cancel,
            ]);
            if (blockBuffer === 'cancel') {
              return reject('cancel');
            }
          } else {
            blockBuffer = await this.fileUtilsLib.readBlock(this.file, from, to);
          }

          artifacts.range[nBlock] = `bytes=${from}-${to - 1}`;
          const data = new Uint8Array(blockBuffer);

          let encrypt: any = null;
          if (dataEncryptionKey) {
            const ivArtifact = binaryStringToBytesBuffer(generateRandomBytesString(12));
            encrypt = encryptWithKeyUsingArtefacts({
              key: dataEncryptionKey,
              data,
              strategy: CipherStrategy.AES_GCM,
              iv: bytesBufferToBinaryString(ivArtifact),
            });
            artifacts.iv[nBlock] = ivArtifact;
            artifacts.at[nBlock] = encrypt.artifacts.at;
          }

          await BlobStorage.putBlock(
            this.url,
            encrypt ? binaryStringToBytesBuffer(encrypt.encrypted) : data,
            blockID
          );

          const progress = (nBlock + 1) / this.totalBlocks;
          if (progressUpdateFunc) {
            progressUpdateFunc(blockBuffer, progress * 100);
          }

          this.totalRemainingBytes -= this.blockSize;

          if (this.totalRemainingBytes < 0) {
            this.totalRemainingBytes = 0;
          }

          if (this.totalRemainingBytes === 0) {
            await commit();
          }

          this.callbacks.onProgress({ progress, fileName: this.file.name });

          if (this.totalRemainingBytes === 0) {
            this.callbacks.onSuccess({ artifacts });
            return resolve();
          }
        } catch (error) {
          this.callbacks.onError(error);
          return reject(error);
        }
      };

      const pool = new ThreadPool(this.simultaneousUploads);

      for (let nBlock = 0; nBlock < this.totalBlocks; nBlock += 1) {
        pool.run(() => job(nBlock, onCancel));
      }
    });

    return p;
  }
}

export default AzureBlockUpload;

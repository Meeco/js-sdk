import * as fs from 'fs';
import * as mime from 'mime-types';
import { Buffer } from 'node:buffer';

// const fs = {
//   statSync(a) {
//     return a;
//   },
//   openSync(a, b) {
//     return a;
//   },
//   closeSync(a) {
//     return a;
//   },
//   read(a, b, c, d, e, f) {
//     return a;
//   }
// };
/**
 * Gets file size
 * @param {String} filePath
 */
export const getSize = (filePath = '') => {
  const { size } = fs.statSync(filePath);
  return size;
};

export const getType = (filePath = '') => mime.lookup(filePath);

/**
 * Reads a part of a file
 * @param {String} filePath
 * @param {Number} from Byte to start reading from
 * @param {Number} to Byte to stop reading. Must be equal or greater than `from`
 */
export const readBlock = (filePath, from, to) =>
  new Promise((resolve, reject) => {
    try {
      const chunkSize = to - from;
      let buffer = Buffer.alloc(chunkSize);

      const fd = fs.openSync(filePath, 'r');

      try {
        const bytesRead = fs.readSync(fd, buffer, {
          length: chunkSize,
          position: from,
        });

        if (bytesRead < chunkSize) {
          buffer = buffer.subarray(0, bytesRead);
        }

        resolve(buffer);
      } finally {
        fs.closeSync(fd);
      }
    } catch (error) {
      reject(error);
    }
  });

/**
 * Base 64 encode the string
 */
export function base64(str: string): string {
  return Buffer.from(str).toString('base64');
}

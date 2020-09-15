import * as fs from 'fs';
import * as mime from 'mime-types';

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
      const buffer = Buffer.alloc(chunkSize);

      const fd = fs.openSync(filePath, 'r');

      /**
       * On read callbackj
       * @param {Error} err
       * @param {Number} nread
       */
      const onRead = (err, nread) => {
        try {
          if (err) {
            return reject(err);
          }

          let data;
          if (nread < chunkSize) {
            data = buffer.slice(0, nread);
          } else {
            data = buffer;
          }

          fs.closeSync(fd);

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      fs.read(fd, buffer, 0, chunkSize, null, onRead);
    } catch (error) {
      reject(error);
    }
  });

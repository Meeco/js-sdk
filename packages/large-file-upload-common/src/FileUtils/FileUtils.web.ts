/**
 * Gets file size
 * @param {File} file
 */
export const getSize = (file: File) => file?.size;

/**
 * Gets file type
 * @param {File} file
 */
export const getType = (file: File) => file?.type;

/**
 * Reads a part of a file
 * @param {File} file File to be read
 * @param {Number} from Byte to start reading from
 * @param {Number} to Byte to stop reading. Must be equal or greater than `from`
 */
export const readBlock = (file, from, to) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Get partial file
    const slicedFile = file.slice(from, to);

    reader.onabort = () => reject(new Error('Reading aborted'));
    reader.onerror = () => reject(new Error('file reading has failed'));
    reader.onload = () => {
      const arrayBuffer = reader.result;
      resolve(arrayBuffer);
    };
    reader.readAsArrayBuffer(slicedFile);
  });

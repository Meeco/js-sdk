/**
 * This file should be deleted before release
 */
import { readFile, unlinkSync, writeFile, WriteFileOptions } from 'fs';
import { promisify } from 'util';

const read = promisify(readFile);
const write = promisify(writeFile);

export const readFileAsText = (file: string) => read(file, 'binary');
export const readFileAsBuffer = (file: string) => read(file);
export const writeFileContents = (file: string, contents, options?: WriteFileOptions) =>
  write(file, contents, options);
export const deleteFileSync = path => unlinkSync(path);

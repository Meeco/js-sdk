/**
 * These utils serve the purpose of providing fs read/write
 * to commands in a way that can be mocked in testing
 * (because if you just mock fs.readFile / fs.writeFile then
 * oclif itself ceases to work as it can not read commands)
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

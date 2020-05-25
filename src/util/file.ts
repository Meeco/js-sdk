/**
 * These utils serve the purpose of providing fs read/write
 * to commands in a way that can be mocked in testing
 * (because if you just mock fs.readFile / fs.writeFile then
 * oclif itself ceases to work as it can not read commands)
 */
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';

const read = promisify(readFile);
const write = promisify(writeFile);

export const readFileAsText = file => read(file, 'binary');
export const readFileAsBuffer = file => read(file);
export const writeFileContents = (file, contents) => write(file, contents);

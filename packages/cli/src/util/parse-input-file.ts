import { readFile } from 'fs';
import { isAbsolute, join } from 'path';
import { promisify } from 'util';
import { parse } from 'yaml';

export function parseInputFile(path: string): Promise<any> {
  if (!isAbsolute(path)) {
    path = join(process.cwd(), path);
  }

  const read = promisify(readFile);
  return read(path, 'utf-8').then(yamlFileContents => parse(yamlFileContents));
}

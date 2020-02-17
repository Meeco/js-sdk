import { readFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { parse } from 'yaml';
import { IEnvironment } from '../models/environment';

const defaultPath = join(__dirname, '../environment.yaml');

export function readEnvironmentFromYamlFile(path: string = defaultPath): Promise<IEnvironment> {
  const read = promisify(readFile);
  return read(path, 'utf-8').then(yamlFileContents => parse(yamlFileContents));
}

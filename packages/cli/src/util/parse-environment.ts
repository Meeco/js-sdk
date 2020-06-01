import { Environment } from '@meeco/sdk';
import { readFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { parse } from 'yaml';

const defaultPath = join(__dirname, '../environment.yaml');

export function readEnvironmentFromYamlFile(path: string = defaultPath): Promise<Environment> {
  const read = promisify(readFile);
  return read(path, 'utf-8').then(yamlFileContents => new Environment(parse(yamlFileContents)));
}

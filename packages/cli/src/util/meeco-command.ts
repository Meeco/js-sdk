import { configureFetch } from '@meeco/sdk';
import { Command, flags as _flags } from '@oclif/command';
import { IConfig } from '@oclif/config';
import { CLIError } from '@oclif/errors';
import cli from 'cli-ux';
import nodeFetch from 'node-fetch';
import { stringify } from 'yaml';
import { UserConfig } from '../configs/user-config';
import { IYamlConfig, IYamlConfigReader } from '../configs/yaml-config';
import { readEnvironmentFromYamlFile } from './parse-environment';
import { parseInputFile } from './parse-input-file';

export default class MeecoCommand extends Command {
  constructor(argv: string[], config: IConfig) {
    super(argv, config);
    configureFetch(nodeFetch);
  }

  /**
   * Note we use this.constructor for parsing flags as superclass/subclass
   * flag sharing isn't properly supported by CLI at this time
   *
   * https://github.com/oclif/oclif/issues/225
   */
  static flags = {
    environment: _flags.string({
      char: 'e',
      description: 'environment config file',
      default: '.environment.yaml',
      required: false,
    }),
  };

  protected updateStatus = cli.action.start.bind(cli.action);
  protected finish = cli.action.stop.bind(cli.action);

  protected printYaml(data: any) {
    this.log(stringify(data));
  }

  protected readYamlFile(path: string): Promise<IYamlConfig | null> {
    return parseInputFile(path);
  }

  protected async readConfigFromFile<T>(configReader: IYamlConfigReader<T>, path: string) {
    const config = await this.readYamlFile(path);
    if (!config) {
      return null;
    }
    return configReader.fromYamlConfig(config);
  }

  protected readEnvironmentFile() {
    const { flags } = this.parse(this.constructor as typeof MeecoCommand);
    const { environment } = flags;
    return readEnvironmentFromYamlFile(environment);
  }

  protected async readUserConfig() {
    const { flags } = this.parse(this.constructor as typeof MeecoCommand);
    const { user } = flags as any;
    let secret, password;
    if (user) {
      const config = await this.readYamlFile(user);
      if (config) {
        ({ secret, password } = UserConfig.fromYamlConfig(config));
      }
    } else {
      ({ secret, password } = flags as any);
    }

    if (!password) {
      while (!password) {
        password = await cli.prompt('Enter password', { type: 'hide' });
      }
    }

    if (!secret) {
      while (!secret) {
        secret = await cli.prompt('Enter secret', { type: 'normal' });
      }
    }

    return new UserConfig(password, secret);
  }

  protected async handleException(err) {
    if (err instanceof CLIError) {
      // Error is already 'handled' by oclif pretty well so can just print as-is
      throw err;
    }
    let message;
    /**
     * Error from the API - convert the body stream to JSON and print that
     */
    if (err.json && typeof err.json === 'function') {
      const result = await err.json().catch(() => '');
      message = `API Responded with ${err.status}:\n ${JSON.stringify(result, null, 2)}`;
    } else {
      // Normal error object - print it with a stack trace if possible
      if (err.stack) {
        message = err.stack;
      } else if (err.message) {
        message = err.message;
      }
    }

    this.error(message);
  }

  async run() {}

  async finally() {
    this.finish();
  }
}

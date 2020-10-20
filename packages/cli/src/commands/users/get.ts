import { UserService } from '@meeco/sdk';
import { MeResponse } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import cli from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { UserDataConfig } from '../../configs/user-data-config';
import userFlags from '../../flags/user-flags';
import MeecoCommand from '../../util/meeco-command';

export default class GetUser extends MeecoCommand {
  static description = 'Fetch details about Meeco user from the various microservices.';
  static examples = [`meeco users:get -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx`];

  static flags = {
    ...MeecoCommand.flags,
    user: _flags.string({
      char: 'c',
      description: '[Deprecated] User config file (if not providing secret and password)',
      required: false,
      exclusive: ['password', 'secret'],
    }),
    ...userFlags,
    auth: _flags.string({
      char: 'a',
      required: false,
      description: 'Authorization config file (if not using the default .user.yaml or password)',
      default: '.user.yaml',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof GetUser);

    try {
      const environment = await this.readEnvironmentFile();
      const service = new UserService(environment, this.updateStatus);

      const { user, auth } = flags;

      // get secret and pass either from file or flags
      const parseResult = user ? await this.readUserConfig() : flags;
      const { secret } = parseResult;
      let { password } = parseResult;

      let result: MeResponse;

      if (secret) {
        if (!password) {
          while (!password) {
            password = await cli.prompt('Enter your password', { type: 'hide' });
          }
        }

        result = await service
          .getOrCreateVaultToken(password, secret)
          .then(token => service.getUser(token));
      } else {
        const authConfig = await this.readConfigFromFile(AuthConfig, auth);
        if (!authConfig) {
          this.error('Must specify a valid auth config file');
        }
        result = await service.getUser(authConfig);
      }

      this.printYaml(UserDataConfig.encodeFromJSON(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

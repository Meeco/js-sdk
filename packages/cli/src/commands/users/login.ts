import { UserService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import cli from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import userFlags from '../../flags/user-flags';
import MeecoCommand from '../../util/meeco-command';

export default class LoginUser extends MeecoCommand {
  static description =
    'Refresh tokens for Keystore and Vault for the given user. Outputs an Authorization config file for use with future commands.';
  static examples = [
    `meeco users:get -a path/to/stale-user-auth.yaml`,
    `meeco users:get -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...userFlags,
    auth: _flags.string({
      char: 'a',
      required: false,
      description: 'Authorization config file (if not using the default .user.yaml or password)',
      default: '.user.yaml',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof LoginUser);
    const { auth } = flags;
    let { secret, password } = flags;

    try {
      const environment = await this.readEnvironmentFile();
      const service = new UserService(environment, this.updateStatus);

      if (!password) {
        while (!password) {
          password = await cli.prompt('Enter your password', { type: 'hide' });
        }
      }

      if (!secret) {
        const authConfig = await this.readConfigFromFile(AuthConfig, auth);
        if (!authConfig) {
          this.error('Must specify a valid auth config file');
        }
        secret = authConfig.secret;
      }

      const result = await service.get(password, secret);
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

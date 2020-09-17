import { UserService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class LogoutUser extends MeecoCommand {
  static description = 'Log the given user out of both keystore and vault.';
  static examples = [
    `meeco users:logout -a path/to/user-auth.yaml`,
    `meeco users:logout -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof LogoutUser);

    try {
      const environment = await this.readEnvironmentFile();
      const service = new UserService(environment, this.updateStatus);
      const { auth } = flags;
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }
      service.deleteSessions(authConfig.vault_access_token, authConfig.keystore_access_token);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { UserService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import userFlags from '../../flags/user-flags';
import MeecoCommand from '../../util/meeco-command';

export default class GetUser extends MeecoCommand {
  static description =
    'Fetch details about Meeco user from the various microservices. Provide either a User config file or password and secret. Outputs an Authorization config file for use with future commands.';
  static examples = [
    `meeco users:get -c path/to/user-config.yaml`,
    `meeco users:get -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...userFlags,
  };

  async run() {
    const { secret, password } = await this.readUserConfig();

    const environment = await this.readEnvironmentFile();
    const service = new UserService(environment, this.updateStatus);
    try {
      const result = await service.get(password, secret);
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

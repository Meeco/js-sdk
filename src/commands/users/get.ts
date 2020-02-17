import { userFlags } from '../../flags/user-flags';
import { UserService } from '../../services/user-service';
import MeecoCommand from '../../util/meeco-command';

export default class GetUser extends MeecoCommand {
  static description = 'Fetch details about Meeco user from the various microservices';
  static examples = [`meeco users:get -c path/to/user-config.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...userFlags
  };

  async run() {
    const { secret, password } = await this.readUserConfig();

    const environment = await this.readEnvironmentFile();
    const service = new UserService(environment, this.updateStatus);
    try {
      const result = await service.get(password, secret);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import { ItemService } from '../../services/item-service';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsList extends MeecoCommand {
  static description = 'describe the command here';
  static examples = [`meeco items:list -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsList);
    const { auth } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ItemService(environment);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    try {
      const items = await service.list(authConfig.vault_access_token);
      this.printYaml(items);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { ItemService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { ItemListConfig } from '../../configs/item-list-config';
import { authFlags } from '../../flags/auth-flags';
import { pageFlags } from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsList extends MeecoCommand {
  static description = 'List the items that a user has in their vault';
  static examples = [`meeco items:list -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsList);
    const { auth, all } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ItemService(environment, this.log);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    try {
      const response = all
        ? await service.listAll(authConfig.vault_access_token)
        : await service.list(authConfig.vault_access_token);

      this.printYaml(ItemListConfig.encodeFromJSON(response));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

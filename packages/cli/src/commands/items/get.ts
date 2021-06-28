import { ItemService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { NewItemConfig } from '../../configs/new-item-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';
import ItemsList from './list';

export default class ItemsGet extends MeecoCommand {
  static description = 'Get an item from the vault and decrypt its values';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [{ name: 'itemId', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsList);
    const { auth } = flags;
    const { itemId } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    const service = new ItemService(environment);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    try {
      this.updateStatus('Fetching item details');
      const result = await service.get(authConfig, itemId);
      this.printYaml(NewItemConfig.encodeFromJSON(result));
    } catch (error) {
      await this.handleException(error);
    }
  }
}

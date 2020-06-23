import { ItemService, ItemUpdateData } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ItemConfig } from '../../configs/item-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';
import ItemsCreate from './create';

export default class ItemsUpdate extends MeecoCommand {
  static description = `Update an item from the vault`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    item: _flags.string({ char: 'i', required: true, description: 'item yaml file' })
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsCreate);
    const { item, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const itemConfigFile = await this.readConfigFromFile(ItemConfig, item);
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    const service = new ItemService(environment);

    if (!itemConfigFile) {
      this.error('Valid item config file must be supplied');
    }
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const { itemConfig } = itemConfigFile;

    if (!itemConfig?.id) {
      this.error('Item update configuration must have an id (expected at spec.id)');
    }

    const updateData = new ItemUpdateData({
      id: itemConfig?.id!,
      label: itemConfig?.label,
      slots: itemConfig?.slots
    });

    try {
      const updatedItem = await service.update(
        authConfig.vault_access_token,
        authConfig.data_encryption_key,
        updateData
      );
      this.printYaml(ItemConfig.encodeFromJSON(updatedItem));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

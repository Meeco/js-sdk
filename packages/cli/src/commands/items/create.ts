import { ItemCreateData, ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ItemConfig } from '../../configs/item-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsCreate extends MeecoCommand {
  static description = 'Create a new item for a user from a template';
  static examples = [`meeco items:create -i path/to/item-config.yaml -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    item: _flags.string({ char: 'i', required: true, description: 'item yaml file' }),
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

    const itemCreateData = new ItemCreateData({
      template_name: itemConfigFile.templateName,
      slots: itemConfig!.slots,
      item: { label: itemConfig!.label },
    });

    try {
      const createdItem = await service.create(authConfig, itemCreateData);
      this.printYaml(ItemConfig.encodeFromJSON(createdItem));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

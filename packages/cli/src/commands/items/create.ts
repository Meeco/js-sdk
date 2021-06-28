import { ItemService, NewItem, NewSlot } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { NewItemConfig } from '../../configs/new-item-config';
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

    const itemConfigFile = await this.readConfigFromFile(NewItemConfig, item);
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);

    const service = new ItemService(environment);

    if (!itemConfigFile) {
      this.error('Valid item config file must be supplied');
    }
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const { itemConfig } = itemConfigFile;

    const newItem = new NewItem(
      itemConfig!.label,
      itemConfigFile.templateName,
      itemConfig!.slots as any as NewSlot[]
    );

    try {
      const createdItem = await service.create(authConfig, newItem);
      this.printYaml(NewItemConfig.encodeFromJSON(createdItem));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

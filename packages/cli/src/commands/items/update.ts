import { ClientTaskQueueService, ItemService, ItemUpdateData } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ItemConfig } from '../../configs/item-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsUpdate extends MeecoCommand {
  static description = `Update an item from the vault. For more detail, refers to README.md Update an Item section`;
  static examples = [`meeco items:update -i path/to/updated-item-config.yaml -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    item: _flags.string({
      char: 'i',
      required: true,
      description:
        'Updated item yaml file. For more detail, refers to README.md Update an Item section',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsUpdate);
    const { item, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const itemConfigFile = await this.readConfigFromFile(ItemConfig, item);
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    const service = new ItemService(environment);
    const clientTaskQueueService = new ClientTaskQueueService(environment);

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
      slots: itemConfig?.slots,
    });

    try {
      const updatedItem = await service.update(authConfig, updateData);
      const result = ItemConfig.encodeFromJSON(updatedItem);

      const outstandingTasks = await clientTaskQueueService.countOutstandingTasks(authConfig);
      const numberOfOutstandingTasks = outstandingTasks.todo + outstandingTasks.in_progress;
      const str =
        '# Item updated. There are ' +
        numberOfOutstandingTasks +
        ' outstanding client tasks. Todo: ' +
        outstandingTasks.todo +
        ' & InProgress: ' +
        outstandingTasks.in_progress;

      this.printYaml(result);
      this.log(str);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

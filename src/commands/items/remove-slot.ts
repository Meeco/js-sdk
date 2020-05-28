import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import { ItemService } from '../../services/item-service';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsRemoveSlot extends MeecoCommand {
  static description = 'Remove a slot from its associated item';

  static example = `meeco items:remove-slot slotId`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'slotId', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsRemoveSlot);
    const environment = await this.readEnvironmentFile();
    const { auth } = flags;
    const { slotId } = args;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const service = new ItemService(environment, this.updateStatus);
      await service.removeSlot(slotId, authConfig.vault_access_token);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

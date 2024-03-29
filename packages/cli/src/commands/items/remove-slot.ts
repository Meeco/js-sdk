import { ItemService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsRemoveSlot extends MeecoCommand {
  static description = 'Remove a slot from its associated item';

  static example = `meeco items:remove-slot slotId`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [{ name: 'slotId', required: true }];

  async run() {
    const { flags, args } = await this.parse(this.constructor as typeof ItemsRemoveSlot);
    const environment = await this.readEnvironmentFile();
    const { auth } = flags;
    const { slotId } = args;

    try {
      let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }
      authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const service = new ItemService(environment, this.updateStatus);
      await service.removeSlot(authConfig, slotId);
      this.log('Slot successfully deleted');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

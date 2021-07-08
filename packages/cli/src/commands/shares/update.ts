import { ShareService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesUpdate extends MeecoCommand {
  static description = 'Update all shared copies of an Item with the data in the original';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    {
      name: 'itemId',
      required: true,
      description: 'ID of the shared Item to update',
    },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof SharesUpdate);

    const { auth } = flags;
    const { itemId } = args;
    const environment = await this.readEnvironmentFile();

    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

    const service = new ShareService(environment, this.updateStatus);
    try {
      const result = await service.updateSharedItem(authConfig, itemId);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

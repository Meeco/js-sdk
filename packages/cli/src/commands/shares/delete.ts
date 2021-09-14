import { ShareService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesDelete extends MeecoCommand {
  static description =
    'Delete a share. Both the owner of the shared data and the recipient of the share can delete the share';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    {
      name: 'shareId',
      required: true,
      description: 'ID of the share to delete',
    },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof SharesDelete);

    const { auth } = flags;
    const { shareId } = args;
    const environment = await this.readEnvironmentFile();

    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

    const service = new ShareService(environment, this.updateStatus);
    try {
      await service.deleteSharedItem(authConfig, shareId);
      this.log('Share successfully deleted');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { ShareService } from '@meeco/sdk';
// import { GetShareResponseToJSON} from '@meeco/vault-api-sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesAccept extends MeecoCommand {
  static description = 'Accept an incoming share';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    {
      name: 'shareId',
      required: true,
      description: 'ID of the share to accept',
    },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof SharesAccept);

    const { auth } = flags;
    const { shareId } = args;
    const environment = await this.readEnvironmentFile();

    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const service = new ShareService(environment, this.updateStatus);
    try {
      const response = await service.acceptIncomingShare(authConfig, shareId);
      this.printYaml(response);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

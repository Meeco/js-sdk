import { ShareService, ShareType } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ShareListConfig } from '../../configs/share-list-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesList extends MeecoCommand {
  static description = 'Get a list of incoming or outgoing shares for the specified user';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    type: _flags.string({
      char: 't',
      default: 'incoming',
      required: false,
      options: ['incoming', 'outgoing'],
      description:
        'There are two types: incoming and outgoing \n incoming - Items shared with you \n outgoing - Items you have shared',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof SharesList);
    const { type, auth } = flags;

    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const service = new ShareService(environment, this.updateStatus);

    try {
      const shareType = ShareType[type];
      const shares = await service.listShares(authConfig, shareType);
      this.printYaml(ShareListConfig.encodeFromJson(shares));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

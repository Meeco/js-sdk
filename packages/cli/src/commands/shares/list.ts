import { ShareService, ShareType } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesList extends MeecoCommand {
  static description = 'Get a list of incoming or outgoing shares for the specified user';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    type: _flags.enum({
      char: 't',
      default: ShareType.Incoming,
      required: false,
      options: Object.values(ShareType),
      description:
        'There are two types: incoming and outgoing \n incoming - Items shared with you \n outgoing - Items you have shared',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof SharesList);
    const { type, auth, all } = flags;

    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const service = new ShareService(environment, this.updateStatus);

    try {
      const shares = all
        ? await service.listAll(authConfig, type)
        : await service.listShares(authConfig, type);

      this.printYaml({
        kind: 'Shares',
        spec: shares,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

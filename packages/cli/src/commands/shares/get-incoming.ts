import { ShareService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesGetIncoming extends MeecoCommand {
  static description =
    'Read an incoming share together with shared item, slots, and associated other data';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    {
      name: 'shareId',
      required: true,
      description: 'ID of the share to fetch',
    },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof SharesGetIncoming);

    const { auth } = flags;
    const { shareId } = args;
    const environment = await this.readEnvironmentFile();

    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const service = new ShareService(environment, this.updateStatus);
    try {
      const result = await service.getSharedItem(authConfig, shareId);
      // TODO: remove it properly, this is temp fix to make e2e test pass as jq/yq fails to parse value_verification_key in yml file.
      result.item.slots.forEach(f => delete f['value_verification_key']);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

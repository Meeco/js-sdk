import { DelegationService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class DelegationAcceptKek extends MeecoCommand {
  static description =
    'Accept a shared KEK (key encryption key) with the from the user you are becoming a delegate for';

  static args = [
    {
      name: 'connectionId',
      required: true,
      description: 'id of the delegate connection',
    },
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof DelegationAcceptKek);
    const { auth } = flags;
    const { connectionId } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('authConfig must be present');
    }
    try {
      const delegationsService = new DelegationService(environment, this.updateStatus);
      await delegationsService.reencryptSharedKek(authConfig, connectionId);

      this.printYaml({ message: 'success' });
    } catch (e) {
      this.error('something went wrong ' + JSON.stringify(e));
    }
  }
}

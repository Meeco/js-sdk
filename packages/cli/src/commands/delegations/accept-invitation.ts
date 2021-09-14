import { DelegationService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ConnectionV2Config } from '../../configs/connection-v2-config';
import { InvitationConfig } from '../../configs/invitation-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class DelegationAcceptInvitation extends MeecoCommand {
  static description = 'Accept a delegation inivitation aka create a delegation connection';

  static args = [
    {
      name: 'recipient_name',
      required: true,
      description: 'Name of the user which the invitation is from',
    },
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({
      char: 'c',
      required: true,
      description: 'Delegation Invitation Config',
    }),
  };

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof DelegationAcceptInvitation);
    const { auth, config } = flags;
    const { recipient_name } = args;
    const delegationInvitationConfig = await this.readConfigFromFile(InvitationConfig, config);
    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('authConfig must be present');
    }
    const invitationToken = delegationInvitationConfig?.invitation?.token;
    if (!invitationToken) {
      this.error('invitationToken must be present');
    }
    const delegationsService = new DelegationService(environment, this.updateStatus);
    const connection = await delegationsService.claimDelegationInvitation(
      authConfig,
      recipient_name,
      invitationToken
    );

    this.printYaml(ConnectionV2Config.encodeFromJSON(connection));
  }
}

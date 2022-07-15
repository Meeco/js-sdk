import { InvitationService } from '@meeco/sdk';
import { Flags as _flags } from '@oclif/core';
import { AuthConfig } from '../../configs/auth-config';
import { ConnectionV2Config } from '../../configs/connection-v2-config';
import { InvitationConfig } from '../../configs/invitation-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersAcceptInvitation extends MeecoCommand {
  static description = 'Accept Invitation to become organization member.';

  static examples = [
    `meeco organization-members:accept-invitation -i .my-member-invitation.yaml -a .user_2.yaml > .my-org-member-connection.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    invitationConfig: _flags.string({
      char: 'i',
      required: true,
      description: 'member invitation yaml file',
    }),
  };

  async run() {
    const { flags } = await this.parse(
      this.constructor as typeof OrganizationMembersAcceptInvitation
    );
    const { invitationConfig, auth } = flags;
    const environment = await this.readEnvironmentFile();
    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);
    const invitationConfigFile = await this.readConfigFromFile(InvitationConfig, invitationConfig);

    if (!invitationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }

    const { invitation } = invitationConfigFile;

    if (!invitation.token) {
      this.error('Organization configuration must have a token (expected at spec.token)');
    }
    try {
      this.updateStatus('Creating organization members connection');
      const service = new InvitationService(environment, {
        error: this.error,
        warn: this.warn,
        log: this.updateStatus,
      });
      const result = await service.accept(authConfig, '', invitation.token);
      this.finish();
      this.printYaml(ConnectionV2Config.encodeFromJSON(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

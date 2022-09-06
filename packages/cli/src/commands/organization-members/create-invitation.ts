import { OrganizationMemberRoles, OrganizationMembersService } from '@meeco/sdk';
import { Flags as _flags } from '@oclif/core';
import { InvitationConfig } from '../../configs/invitation-config';
import { OrganizationAuthConfig } from '../../configs/organization-auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersCreateInvitation extends MeecoCommand {
  static description =
    'Create Invitation to invite other vault users as member of organization. This command is only accessible to organization agent.';

  static examples = [
    `meeco organization-members:create-invitation -o .my-created-organization.yaml -a .my-org-login.yaml > .my-org-member-invitation.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    org: _flags.string({ char: 'o', required: true, description: 'organization yaml file' }),
  };

  static args = [
    {
      name: 'member_role',
      required: false,
      default: OrganizationMemberRoles.Admin,
      description: 'Organization member avalible roles: ' + Object.keys(OrganizationMemberRoles),
    },
  ];

  async run() {
    const { flags, args } = await this.parse(
      this.constructor as typeof OrganizationMembersCreateInvitation
    );
    const { org, auth } = flags;
    const { member_role } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(OrganizationAuthConfig, auth);
    const organizationConfigFile = await this.readConfigFromFile(OrganizationConfig, org);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    if (!organizationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }

    const { metadata } = organizationConfigFile;

    if (!metadata?.publicKey) {
      this.error(
        'Organization configuration must have an public key (expected at metadata.publicKey)'
      );
    }
    try {
      this.updateStatus('Creating organization members invitation');
      const service = new OrganizationMembersService(environment, this.updateStatus);
      const result = await service.createInvite(authConfig, metadata.publicKey, member_role);
      this.finish();
      this.printYaml(InvitationConfig.encodeFromJSON(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

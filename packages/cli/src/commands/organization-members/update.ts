import { mockableFactories } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationMemberConfig } from '../../configs/organization-member-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersUpdate extends MeecoCommand {
  static description = `Change the role of a member. This command is only accessible to organization owners. The system will not allow to demote the last owner of the organization.`;

  static examples = [`meeco organization-members:update -m .my-created-org-member.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationMemberConfig: _flags.string({
      char: 'm',
      required: true,
      description: 'org member yaml file',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof OrganizationMembersUpdate);
    const { organizationMemberConfig, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const organizationMemberConfigFile = await this.readConfigFromFile(
      OrganizationMemberConfig,
      organizationMemberConfig
    );
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);

    if (!organizationMemberConfigFile) {
      this.error('Valid org member config file must be supplied');
    }
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    const { member } = organizationMemberConfigFile;

    if (!member?.id) {
      this.error('Member update configuration must have an id (expected at spec.id)');
    }

    if (!member?.organization_id) {
      this.error(
        'Member update configuration must have an organization_id (expected at spec.organization_id)'
      );
    }
    if (!member?.role) {
      this.error(
        'Member update configuration must have an role (expected at spec.organization_id)'
      );
    }

    try {
      await mockableFactories
        .vaultAPIFactory(environment)(authConfig)
        .OrganizationsManagingMembersApi.organizationsOrganizationIdMembersIdPut(
          member.organization_id,
          member.id,
          {
            organization_member: {
              role: member.role,
            },
          }
        );
      this.log('Successfully updated');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

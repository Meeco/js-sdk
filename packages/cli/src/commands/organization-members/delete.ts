import { mockableFactories } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersDelete extends MeecoCommand {
  static description =
    'Delete a member of an organization. This command is only accessible to organization owners. The system will not allow to delete the last owner of the organization.';

  static examples = [`meeco organization-members:delete <organization_id> <id>`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    { name: 'organization_id', required: true, description: 'ID of the Organization' },
    { name: 'id', required: true, description: 'user ID of the Member' },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof OrganizationMembersDelete);

    const { auth } = flags;
    const { organization_id, id } = args;
    const environment = await this.readEnvironmentFile();

    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    try {
      await mockableFactories
        .vaultAPIFactory(environment)(authConfig)
        .OrganizationsManagingMembersApi.organizationsOrganizationIdMembersIdDelete(
          organization_id,
          id
        );
      this.log('Member successfully deleted');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

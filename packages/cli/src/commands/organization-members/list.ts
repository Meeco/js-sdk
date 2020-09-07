import { getAllPaged, reducePages, vaultAPIFactory } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersList extends MeecoCommand {
  static description =
    'List all members of an organization. This command is only accessible to organization owners.';

  static examples = [`meeco organization-members:list <organization_id>`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [{ name: 'organization_id', required: true }];

  async run() {
    try {
      const { flags, args } = this.parse(this.constructor as typeof OrganizationMembersList);
      const { auth } = flags;
      const { organization_id } = args;

      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      this.updateStatus('Fetching organization members');

      const api = vaultAPIFactory(environment)(authConfig).OrganizationsManagingMembersApi;
      const result = await getAllPaged(cursor =>
        api.organizationsOrganizationIdMembersGet(organization_id, cursor)
      ).then(reducePages);

      this.finish();
      this.printYaml({
        kind: 'OrganizationMembers',
        spec: { organization: result.organization, members: result.members },
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { vaultAPIFactory } from '@meeco/sdk';
import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationMembersList extends MeecoCommand {
  static description =
    'List all members of an organization. This command is only accessible to organization owners.';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'organization_id', required: true }];

  async run() {
    try {
      const { flags, args } = this.parse(this.constructor as typeof OrganizationMembersList);
      const { auth } = flags;
      const { organization_id } = args;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      cli.action.start('Fetching organization members');
      const result = await vaultAPIFactory(environment)(
        authConfig
      ).OrganizationsManagingMembersApi.organizationsOrganizationIdMembersGet(organization_id);
      cli.action.stop();
      this.printYaml({
        kind: 'Organization-Members',
        spec: { organization: result.organization, members: result.members }
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

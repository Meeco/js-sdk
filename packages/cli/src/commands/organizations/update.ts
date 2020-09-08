import { vaultAPIFactory } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsUpdate extends MeecoCommand {
  static description = `Modify a requested organization. The user who requested the organization can use this endpoint to modify the requested organization.`;

  static examples = [`meeco organizations:update -o .my-updated-organization`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    org: _flags.string({ char: 'o', required: true, description: 'organization yaml file' }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof OrganizationsUpdate);
    const { org, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const organizationConfigFile = await this.readConfigFromFile(OrganizationConfig, org);
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!organizationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const { organization } = organizationConfigFile;

    if (!organization?.id) {
      this.error('Organization update configuration must have an id (expected at spec.id)');
    }

    try {
      this.updateStatus('Updating organization details');
      const result = await vaultAPIFactory(environment)(
        authConfig
      ).OrganizationsManagingOrganizationsApi.organizationsIdPut(organization.id, {
        organization,
      });
      this.printYaml(OrganizationConfig.encodeFromJSON(result.organization));
      this.updateStatus('Successfully updated');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

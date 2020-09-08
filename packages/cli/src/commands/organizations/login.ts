import { OrganizationsService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsLogin extends MeecoCommand {
  static description =
    'Login as an organization agent. An organization agent is a non-human Vault user account acting on behalf of the organization. An organization owner can use this command to obtain a session token for the organization agent.';

  static examples = [
    `meeco organizations:login -o .my-created-organization.yaml > .my-org-login.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    org: _flags.string({ char: 'o', required: true, description: 'organization yaml file' }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof OrganizationsLogin);
    const { org, auth } = flags;
    const environment = await this.readEnvironmentFile();
    const organizationConfigFile = await this.readConfigFromFile(OrganizationConfig, org);
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    if (!organizationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }

    const { organization, metadata } = organizationConfigFile;

    if (!organization?.id) {
      this.error('Organization configuration must have an id (expected at spec.id)');
    }

    if (!metadata?.privateKey) {
      this.error(
        'Organization configuration must have an private key (expected at metadata.privateKey)'
      );
    }

    try {
      this.updateStatus('Login as an organization agent');
      const service = new OrganizationsService(environment, authConfig!.vault_access_token);
      this.updateStatus('Fetching organization agent credentials');
      const result = await service.getLogin(organization.id, metadata.privateKey);
      this.finish();
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

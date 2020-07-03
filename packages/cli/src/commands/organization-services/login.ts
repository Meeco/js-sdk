import { OrganizationServicesService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesLogin extends MeecoCommand {
  static description =
    'Login as a service agent. An service agent is a non-human Vault user account acting on behalf of the service. An organization owner or admin can use this command to obtain a session token for the service agent.';

  static examples = [
    `meeco organization-services:login <organization_id> <service_id> -a path/to/auth.yaml`
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [
    { name: 'organization_id', required: true },
    { name: 'service_id', required: true }
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationServicesLogin);
    const { auth } = flags;
    const { organization_id, service_id } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    try {
      const service = new OrganizationServicesService(environment, authConfig!.vault_access_token);
      this.updateStatus('Fetching organization service agent credentials');
      const result = await service.getLogin(organization_id, service_id);
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { OrganizationServicesService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationServiceConfig } from '../../configs/organization-service-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesLogin extends MeecoCommand {
  static description = `Login as a service agent. An organization owner or admin can use this command to obtain a session token for the service agent.`;

  static examples = [`meeco organization-services:login -s .my-created-service.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationServiceConfig: _flags.string({
      char: 's',
      required: true,
      description: 'service yaml file',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof OrganizationServicesLogin);
    const { auth, organizationServiceConfig } = flags;
    const environment = await this.readEnvironmentFile();

    const organizationServiceConfigFile = await this.readConfigFromFile(
      OrganizationServiceConfig,
      organizationServiceConfig
    );
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!organizationServiceConfigFile) {
      this.error('Valid service config file must be supplied');
    }

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const { service, metadata } = organizationServiceConfigFile;

    if (!service?.id) {
      this.error('Service update configuration must have an id (expected at spec.id)');
    }

    if (!service?.organization_id) {
      this.error('Service update configuration must have an id (expected at spec.organization_id)');
    }

    if (!metadata?.privateKey) {
      this.error(
        'Service configuration must have an private key (expected at metadata.privateKey)'
      );
    }

    try {
      const orgService = new OrganizationServicesService(environment, authConfig);
      this.updateStatus('Fetching organization service agent credentials');
      const result = await orgService.getLogin(
        service.organization_id,
        service.id,
        metadata.privateKey
      );
      this.finish();
      this.printYaml({
        kind: AuthConfig.kind,
        metadata: result,
        spec: {},
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

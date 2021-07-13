import { mockableFactories } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationServiceConfig } from '../../configs/organization-service-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesUpdate extends MeecoCommand {
  static description = `Modify a requested organization service. Members of the organization with roles owner and admin can use this command to modify the requested service.`;

  static examples = [
    `meeco organization-services:update <organization_id> -s .my-created-service.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationServiceConfig: _flags.string({
      char: 's',
      required: true,
      description: 'service yaml file',
    }),
  };

  static args = [{ name: 'organization_id', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationServicesUpdate);
    const { organizationServiceConfig, auth } = flags;
    const { organization_id } = args;
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
    const { service } = organizationServiceConfigFile;

    if (!service?.id) {
      this.error('Service update configuration must have an id (expected at spec.id)');
    }

    try {
      this.updateStatus('Updating service details');
      const result = await mockableFactories
        .vaultAPIFactory(environment)(authConfig)
        .OrganizationsManagingServicesApi.organizationsOrganizationIdServicesIdPut(
          service.id,
          organization_id,
          {
            service: organizationServiceConfigFile.service,
          }
        );
      this.printYaml(OrganizationServiceConfig.encodeFromJSON(result.service));
      this.updateStatus('Successfully updated');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { mockableFactories } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationServiceConfig } from '../../configs/organization-service-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesGet extends MeecoCommand {
  static description =
    'Retrieve a validated organization service. Only validated services are accessible.';

  static examples = [
    `meeco organization-services:get <organization_id> <service_id> > .my-created-service.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    { name: 'organization_id', required: true },
    { name: 'service_id', required: true },
  ];

  async run() {
    const { flags, args } = await this.parse(this.constructor as typeof OrganizationServicesGet);
    const { auth } = flags;
    const { organization_id, service_id } = args;
    const environment = await this.readEnvironmentFile();
    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

    try {
      this.updateStatus('Fetching service details');
      const result = await mockableFactories
        .vaultAPIFactory(environment)(authConfig)
        .OrganizationsForVaultUsersApi.organizationsOrganizationIdServicesIdGet(
          organization_id,
          service_id
        );
      this.finish();
      this.printYaml(OrganizationServiceConfig.encodeFromJSON(result.service));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

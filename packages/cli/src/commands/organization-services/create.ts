import { OrganizationServicesService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationServiceConfig } from '../../configs/organization-service-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesCreate extends MeecoCommand {
  static description = `Request the creation of a new organization service. \
The organization service will remain in the 'requested' state until validated \
or rejected by meeco`;

  static examples = [
    `meeco organization-services:create <organization_id> -c .my-service-config.yaml > .my-created-service.yaml`
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationServiceConfig: _flags.string({
      char: 'c',
      required: true,
      description: 'organization service config file'
    })
  };

  static args = [{ name: 'organization_id', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationServicesCreate);
    const { organizationServiceConfig, auth } = flags;
    const { organization_id } = args;
    const environment = await this.readEnvironmentFile();

    const organizationServiceConfigFile = await this.readConfigFromFile(
      OrganizationServiceConfig,
      organizationServiceConfig
    );
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    if (!organizationServiceConfigFile) {
      this.error('Valid organization service config file must be supplied');
    }
    try {
      const service = new OrganizationServicesService(environment, authConfig!.vault_access_token);
      this.updateStatus('Creating Service');
      const result = await service.create(organization_id, organizationServiceConfigFile.service);
      this.finish();
      this.printYaml(
        OrganizationServiceConfig.encodeFromJSON(result.service, { privateKey: result.privateKey })
      );
    } catch (err) {
      await this.handleException(err);
    }
  }
}

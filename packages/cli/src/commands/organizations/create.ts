import { OrganizationsService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class CreateOrganisation extends MeecoCommand {
  static description = `Request the creation of a new organization. \
The organization will remain in the 'requested' state until validated \
or rejected by meeco`;

  static examples = [
    `meeco organizations:create -c .my-organization-config.yaml > .my-created-organization.yaml`
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationConfig: _flags.string({
      char: 'c',
      required: true,
      description: 'organization config file'
    })
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof CreateOrganisation);
    const { organizationConfig, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const organizationConfigFile = await this.readConfigFromFile(
      OrganizationConfig,
      organizationConfig
    );
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    if (!organizationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }
    try {
      const service = new OrganizationsService(environment, authConfig!.vault_access_token);
      this.updateStatus('Creating Organization');
      const result = await service.create(organizationConfigFile.organization);
      this.finish();
      this.printYaml(
        OrganizationConfig.encodeFromJSON(result.organization, { privateKey: result.privateKey })
      );
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { OrganizationService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class CreateOrganisation extends MeecoCommand {
  static description = `Request the creation of a new organization. \
The organization will remain in the 'requested' state until validated \
or rejected by meeco`;

  static examples = [
    `meeco organizations:create -c .my-organization-config.yaml > .my-created-organization.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    organizationConfig: _flags.string({
      char: 'c',
      required: true,
      description: 'organization config file',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof CreateOrganisation);
    const { organizationConfig, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const organizationConfigFile = await this.readConfigFromFile(
      OrganizationConfig,
      organizationConfig
    );
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    if (!organizationConfigFile) {
      this.error('Valid organization config file must be supplied');
    }
    try {
      const service = new OrganizationService(environment, this);
      this.updateStatus('Creating Organization');
      const { name, ...orgInfo } = organizationConfigFile.organization;
      const result = await service.create(authConfig!, name!, orgInfo);
      this.finish();
      this.printYaml(
        OrganizationConfig.encodeFromJSON(result.organization, {
          privateKey: result.privateKey,
          publicKey: result.publicKey,
        })
      );
    } catch (err) {
      await this.handleException(err);
    }
  }
}

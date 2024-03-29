import { mockableFactories } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsGet extends MeecoCommand {
  static description =
    'Retrieve a validated organization or requested organization by logged in user. Only all validated organizations or requested organization requested by logged in user are accessible.';

  static examples = [`meeco organizations:get <organization_id>`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [{ name: 'id', required: true }];

  async run() {
    const { flags, args } = await this.parse(this.constructor as typeof OrganizationsGet);
    const { auth } = flags;
    const { id } = args;
    const environment = await this.readEnvironmentFile();
    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

    try {
      this.updateStatus('Fetching organizations');
      const result = await mockableFactories
        .vaultAPIFactory(environment)(authConfig)
        .OrganizationsForVaultUsersApi.organizationsIdGet(id);
      this.finish();
      this.printYaml(OrganizationConfig.encodeFromJSON(result.organization));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

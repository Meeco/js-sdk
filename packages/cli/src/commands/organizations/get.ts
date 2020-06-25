import { vaultAPIFactory } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationConfig } from '../../configs/organization-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsGet extends MeecoCommand {
  static description =
    'Retrieve a validated organization or requested organization by logged in user. This endpoint can be called by anyone. Only all validated organizations or requested organization requested by logged in user are accessible.';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'id', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationsGet);
    const { auth } = flags;
    const { id } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    try {
      this.updateStatus('Fetching item details');
      const result = await vaultAPIFactory(environment)(
        authConfig
      ).OrganizationsForVaultUsersApi.organizationsIdGet(id);
      this.printYaml(OrganizationConfig.encodeFromJSON(result.organization));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

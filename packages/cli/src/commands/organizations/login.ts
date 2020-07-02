import { OrganizationsService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsLogin extends MeecoCommand {
  static description =
    'Login as an organization agent. An organization agent is a non-human Vault user account acting on behalf of the organization. An organization owner can use this command to obtain a session token for the organization agent.';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'id', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationsLogin);
    const { auth } = flags;
    const { id } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    try {
      const service = new OrganizationsService(environment, authConfig!.vault_access_token);
      this.updateStatus('Fetching organization agent credentials');
      const result = await service.getLogin(id);
      this.printYaml(AuthConfig.encodeFromAuthData(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

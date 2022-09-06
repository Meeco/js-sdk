import { ConnectionService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsList extends MeecoCommand {
  static description = 'List connections for an authenticated user';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
  };

  async run() {
    const { flags } = await this.parse(ConnectionsList);
    const { auth, all } = flags;
    try {
      const environment = await this.readEnvironmentFile();
      let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }
      authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

      const service = new ConnectionService(environment, {
        error: this.error,
        warn: this.warn,
        log: this.updateStatus,
      });

      const result = all ? await service.listAll(authConfig) : await service.list(authConfig);

      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

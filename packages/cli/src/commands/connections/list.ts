import { ConnectionService } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsList extends MeecoCommand {
  static description = 'List connections for an authenticated user';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  async run() {
    const { flags } = this.parse(ConnectionsList);
    const { auth } = flags;
    try {
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify authentication file');
      }

      const service = new ConnectionService(environment, this.updateStatus);
      const result = await service.listConnections(authConfig);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

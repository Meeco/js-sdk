import { flags as _flags } from '@oclif/command';
import { ConnectionConfig } from '../../configs/connection-config';
import { ConnectionService } from '../../services/connection-service';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsCreate extends MeecoCommand {
  static description = 'Create a new connection between two users';

  static flags = {
    ...MeecoCommand.flags,
    config: _flags.string({
      char: 'c',
      description: 'Connection config file to use for the creation',
      required: true
    })
  };

  async run() {
    const { flags } = this.parse(ConnectionsCreate);
    const { config } = flags;

    try {
      const environment = await this.readEnvironmentFile();
      const connection = await this.readConfigFromFile(ConnectionConfig, config);

      if (!connection) {
        this.error('Must specify valid connection config file');
      }

      const service = new ConnectionService(environment, this.updateStatus);
      const result = await service.createConnection(connection);
      this.printYaml(result);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

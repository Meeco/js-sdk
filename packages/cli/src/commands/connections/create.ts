import { ConnectionService } from '@meeco/sdk';
import { Flags as _flags } from '@oclif/core';
import { ConnectionConfig } from '../../configs/connection-config';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsCreate extends MeecoCommand {
  static description = 'Create a new connection between two users';

  static flags = {
    ...MeecoCommand.flags,
    config: _flags.string({
      char: 'c',
      description: 'Config file describing new connection',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(ConnectionsCreate);
    const { config } = flags;

    try {
      const environment = await this.readEnvironmentFile();
      const connection = await this.readConfigFromFile(ConnectionConfig, config);

      if (!connection) {
        this.error('Must specify valid connection config file');
      }

      const service = new ConnectionService(environment, this.updateStatus);
      const result = await service.createConnection(connection.toConnectionCreateData());
      this.printYaml(ConnectionConfig.encodeFromJson(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

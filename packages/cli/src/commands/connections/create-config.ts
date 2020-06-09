import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ConnectionConfig } from '../../configs/connection-config';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsCreateConfig extends MeecoCommand {
  static description = 'Scaffold a connection config file when given two users';

  static flags = {
    ...MeecoCommand.flags,
    from: _flags.string({
      required: true,
      char: 'f',
      description: `User config file for the 'from' user`
    }),
    to: _flags.string({
      required: true,
      char: 't',
      description: `User config file for the 'to' user`
    })
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ConnectionsCreateConfig);
    const { from, to } = flags;
    const fromUser = await this.readConfigFromFile(AuthConfig, from);
    const toUser = await this.readConfigFromFile(AuthConfig, to);
    if (!fromUser || !toUser) {
      this.error('Both a valid from and to user config file are required');
    }
    this.printYaml(ConnectionConfig.encodeFromUsers(fromUser, toUser));
  }
}

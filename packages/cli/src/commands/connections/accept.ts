import { InvitationService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ConnectionsAccept extends MeecoCommand {
  static description = 'Create a new connection from an invitation token';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    name: _flags.string({
      char: 'n',
      description: 'Name for new Connection',
      required: false,
      default: 'anonymous',
    }),
  };

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Connection Invitation Token',
    },
  ];

  async run() {
    const { flags, args } = this.parse(ConnectionsAccept);
    const { name, auth } = flags;
    const { token } = args;

    try {
      const environment = await this.readEnvironmentFile();
      const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(
        flags
      );
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }

      const service = new InvitationService(environment, this.updateStatus);
      const result = await service.accept(authConfig, name, token);
      this.printYaml(result);
      this.finish();
    } catch (err) {
      await this.handleException(err);
    }
  }
}

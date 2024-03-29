import { InvitationService } from '@meeco/sdk';
import { Flags as _flags } from '@oclif/core';
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
    const { flags, args } = await this.parse(ConnectionsAccept);
    const { name, auth } = flags;
    const { token } = args;

    try {
      const environment = await this.readEnvironmentFile();
      let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }
      authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);

      const service = new InvitationService(environment, this.updateStatus);
      const result = await service.accept(authConfig, name, token);
      this.printYaml(result);
      this.finish();
    } catch (err) {
      await this.handleException(err);
    }
  }
}

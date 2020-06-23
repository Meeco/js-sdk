import { ClientTaskQueueService, State } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueList extends MeecoCommand {
  static description = 'Read the client task that client is supposed to perform';
  static examples = [`meeco client-task-queue:list -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'state', required: false }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ClientTaskQueueList);
    const { auth } = flags;
    const { state } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ClientTaskQueueService(environment);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    try {
      const clientTaskQueueState = State[state];
      if (state && clientTaskQueueState === undefined) {
        this.error(
          'Invalid state provided, state argument value must be one of this: ' + Object.keys(State)
        );
      }
      const response = await service.list(authConfig.vault_access_token, clientTaskQueueState);
      this.printYaml({
        kind: 'ClientTaskQueue',
        spec: response.client_tasks
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

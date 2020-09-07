import { ClientTaskQueueService, State } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueList extends MeecoCommand {
  static description = 'Read the client task that client is supposed to perform';
  static examples = [`meeco client-task-queue:list -a path/to/auth.yaml`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    supressChangingState: _flags.string({
      required: false,
      default: 'true',
      description: 'suppress transitioning tasks in the response to in_progress: true, false',
    }),
    state: _flags.string({
      char: 's',
      required: false,
      default: 'Todo',
      description: 'Client Task Queue avalible states: ' + Object.keys(State),
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ClientTaskQueueList);
    const { supressChangingState, state, auth } = flags;
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
      const response = await service.listAll(
        authConfig.vault_access_token,
        supressChangingState === 'false' ? false : true,
        clientTaskQueueState
      );
      this.printYaml({
        kind: 'ClientTaskQueue',
        spec: response.client_tasks,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

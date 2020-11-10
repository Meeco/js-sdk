import { ClientTaskQueueService } from '@meeco/sdk';
import { ClientTaskQueueGetStateEnum } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueRunBatch extends MeecoCommand {
  static description = 'Load and run a batch of ClientTasks from the queue';
  static examples = [`meeco client-task-queue:run-batch -a path/to/auth.yaml 10`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    supressChangingState: _flags.string({
      required: false,
      default: 'true',
      description: 'suppress transitioning tasks in the response to in_progress: true, false',
    }),
    states: _flags.string({
      char: 's',
      required: false,
      default: 'Todo',
      description:
        'Client Task Queue avalible states: ' +
        Object.keys(ClientTaskQueueGetStateEnum) +
        ' e.g Todo,InProgress ',
    }),
  };

  static args = [
    {
      name: 'numberOfTasks',
      description: 'number of tasks to fetch and execute',
      required: false,
      default: undefined,
    },
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ClientTaskQueueRunBatch);
    const { supressChangingState, states, auth } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ClientTaskQueueService(environment);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    try {
      const clientTaskQueueStates: ClientTaskQueueGetStateEnum[] = [];
      states.split(',').forEach(state => {
        const clientTaskQueueState = ClientTaskQueueGetStateEnum[state];
        clientTaskQueueStates.push(clientTaskQueueState);
        if (clientTaskQueueState === undefined) {
          this.error(
            'Invalid state provided, state argument value must be one of this: ' +
              Object.keys(ClientTaskQueueGetStateEnum)
          );
        }
      });

      const numberOfTasks = args.numberOfTasks;
      const clientTaskList = await service.list(
        authConfig.vault_access_token,
        supressChangingState === 'false' ? false : true,
        clientTaskQueueStates,
        undefined,
        { perPage: numberOfTasks }
      );

      const executionResults = await service.executeClientTasks(
        clientTaskList.client_tasks,
        authConfig
      );

      this.printYaml(executionResults);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

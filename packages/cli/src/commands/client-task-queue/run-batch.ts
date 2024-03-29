import { ClientTaskQueueService, ClientTaskState } from '@meeco/sdk';
import { ClientTask } from '@meeco/vault-api-sdk';
import { Flags as _flags } from '@oclif/core';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueRunBatch extends MeecoCommand {
  static description = 'Load and run Client Tasks from the queue';
  static examples = [
    `meeco client-task-queue:run-batch --limit 10`,
    `meeco client-task-queue:run-batch --all --state failed`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    limit: _flags.integer({
      required: false,
      char: 'l',
      description: `Run at most 'limit' many Client Tasks. Defaults to the API page size (200)`,
      exclusive: ['all'],
    }),
    state: _flags.enum({
      char: 's',
      required: false,
      default: ClientTaskState.Todo,
      options: [ClientTaskState.Todo, ClientTaskState.Failed],
      description: 'Run only Client Tasks with the given state',
    }),
  };

  async run() {
    const { flags } = await this.parse(this.constructor as typeof ClientTaskQueueRunBatch);
    const { all, state, limit, auth } = flags;
    const environment = await this.readEnvironmentFile();
    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);
    const service = new ClientTaskQueueService(environment, this);

    if (limit && limit <= 0) {
      this.error('Must specify a positive limit');
    }

    try {
      let tasks: ClientTask[];
      this.log('Retrieving tasks');
      if (all) {
        tasks = await service.listAll(authConfig, false, [state]);
      } else if (limit) {
        tasks = await service
          .list(authConfig, false, [state], undefined, {
            nextPageAfter: limit.toString(),
          })
          .then(r => r.client_tasks);
      } else {
        tasks = await service.list(authConfig, true, [state]).then(r => r.client_tasks);
      }

      const executionResults = await service.execute(authConfig, tasks);

      this.printYaml(executionResults);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

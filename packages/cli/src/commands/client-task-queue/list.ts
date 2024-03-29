import { ClientTaskQueueService, ClientTaskState } from '@meeco/sdk';
import { ClientTask } from '@meeco/vault-api-sdk';
import { Flags as _flags } from '@oclif/core';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueList extends MeecoCommand {
  static description = 'Read Client Tasks assigned to the user';
  static examples = [
    `meeco client-task-queue:list --state failed --all`,
    `meeco client-task-queue:list --update --state todo --limit 5`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    limit: _flags.integer({
      required: false,
      char: 'l',
      description: `Get at most 'limit' many Client Tasks`,
      exclusive: ['all'],
    }),
    update: _flags.boolean({
      required: false,
      default: false,
      description: `Set the state of retrieved "todo" Client Tasks to "in_progress" in the API`,
    }),
    state: _flags.build<ClientTaskState[]>({
      char: 's',
      required: false,
      parse: async input =>
        input
          .split(',')
          .filter(x =>
            Object.values(ClientTaskState).includes(x as ClientTaskState)
          ) as ClientTaskState[],
      description: `Filter Client Tasks by execution state. Can take multiple values separated by commas. Values can be (${Object.values(
        ClientTaskState
      ).join('|')})`,
    })(),
  };

  async run() {
    const { flags } = await this.parse(this.constructor as typeof ClientTaskQueueList);
    const { limit, update, auth, all } = flags;

    let { state } = flags;
    if (state && state.length === 0) {
      state = undefined;
    }

    const environment = await this.readEnvironmentFile();
    let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);
    const service = new ClientTaskQueueService(environment, this.log);

    if (limit && limit <= 0) {
      this.error('Must specify a positive limit');
    }

    try {
      let response: ClientTask[];
      if (all) {
        response = await service.listAll(authConfig, update, state);
      } else if (limit) {
        response = await service
          .list(authConfig, update, state, undefined, {
            nextPageAfter: limit.toString(),
          })
          .then(r => r.client_tasks);
      } else {
        response = await service.list(authConfig, update, state).then(r => r.client_tasks);
      }

      this.printYaml({
        kind: 'ClientTaskQueue',
        spec: response,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

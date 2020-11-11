import { ClientTaskQueueService } from '@meeco/sdk';
import { ClientTask, ClientTaskQueueGetStateEnum as ClientTaskState } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
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
      parse: input =>
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
    const { flags } = this.parse(this.constructor as typeof ClientTaskQueueList);
    const { limit, update, auth, all } = flags;

    let { state } = flags;
    if (state && state.length == 0) {
      state = undefined;
    }

    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ClientTaskQueueService(environment, this.log);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    if (limit && limit <= 0) {
      this.error('Must specify a positive limit');
    }

    try {
      let response: ClientTask[];
      if (all) {
        response = await service.listAll(authConfig.vault_access_token, update, state);
      } else if (limit) {
        response = await service
          .list(authConfig.vault_access_token, update, state, undefined, {
            nextPageAfter: limit.toString(),
          })
          .then(r => r.client_tasks);
      } else {
        response = await service
          .list(authConfig.vault_access_token, update, state)
          .then(r => r.client_tasks);
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

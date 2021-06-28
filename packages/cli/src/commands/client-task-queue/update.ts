import { ClientTaskQueueService, ClientTaskState } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueUpdate extends MeecoCommand {
  static description = 'Set Client Task states using YAML file';
  static examples = [
    `meeco client-task-queue:update updated_tasks.yaml`,
    `meeco client-task-queue:update --set done tasks.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    set: _flags.enum({
      required: false,
      options: Object.values(ClientTaskState),
      description: 'Set all Client Tasks to this state',
    }),
  };

  static args = [
    {
      name: 'tasks_file',
      required: true,
      description:
        'YAML file with a list of Client Tasks to update. Matches output format of client-task-queue:list',
    },
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ClientTaskQueueUpdate);
    const { set, auth } = flags;
    const { tasks_file } = args;
    const environment = await this.readEnvironmentFile();
    const service = new ClientTaskQueueService(environment, this);

    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    const tasks = await this.readYamlFile(tasks_file);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    if (!tasks) {
      this.error('Must specify a tasks file');
    }

    try {
      const update = set
        ? tasks?.spec.map(({ id }) => ({ id, state: set }))
        : tasks?.spec.map(({ id, state }) => ({ id, state }));

      this.updateStatus('Updating Client Tasks');
      const result = await service.getAPI(authConfig).clientTaskQueuePut({
        client_tasks: update,
      });

      this.printYaml({
        kind: 'ClientTaskQueue',
        spec: result.client_tasks,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

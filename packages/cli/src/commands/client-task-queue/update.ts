import { ClientTaskQueueService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { ClientTasksConfig } from '../../configs/client-tasks';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ClientTaskQueueUpdate extends MeecoCommand {
  static description = `Update a client tasks`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    tasks: _flags.string({ char: 'i', required: true, description: 'client tasks yaml file' })
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ClientTaskQueueUpdate);
    const { tasks, auth } = flags;
    const environment = await this.readEnvironmentFile();

    const clientTasksConfigFile = await this.readConfigFromFile(ClientTasksConfig, tasks);
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    const service = new ClientTaskQueueService(environment);

    if (!clientTasksConfigFile) {
      this.error('Valid item config file must be supplied');
    }
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const { clientTasksConfig } = clientTasksConfigFile;

    if (!clientTasksConfig?.client_tasks) {
      this.error('client tasks configuration must have an clientTasks');
    }

    clientTasksConfig.client_tasks.map((m, index) => {
      if (!m?.id) {
        this.error('client tasks no: ' + index + ' must have an id (expected at spec.id)');
      }
    });

    try {
      const response = await service.update(authConfig.vault_access_token, clientTasksConfig);

      const outstandingTasks = await service.countOutstandingTasks(authConfig.vault_access_token);
      const numberOfOutstandingTasks = outstandingTasks.todo + outstandingTasks.in_progress;
      const str =
        '# Item updated. There are ' +
        numberOfOutstandingTasks +
        ' outstanding client tasks. Todo: ' +
        outstandingTasks.todo +
        ' & InProgress: ' +
        outstandingTasks.in_progress;

      this.printYaml({
        kind: 'ClientTaskQueue',
        spec: { client_tasks: response.client_tasks }
      });
      this.log(str);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

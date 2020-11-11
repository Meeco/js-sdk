import {
  ClientTask,
  ClientTaskQueueGetStateEnum as ClientTaskState,
  ClientTaskQueueResponse,
} from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { Environment } from '../models/environment';
import { MeecoServiceError } from '../models/service-error';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import { ShareService } from './share-service';

interface IFailedClientTask extends ClientTask {
  failureReason: any;
}

export interface IOutstandingClientTasks {
  todo: number;
  in_progress: number;
}

export interface IClientTaskExecResult {
  completed: ClientTask[];
  failed: IFailedClientTask[];
}

/**
 * A ClientTask describes a set of API actions the client has been requested to perform,
 * usually encrypting some data with their private keys.
 */
export class ClientTaskQueueService {
  private vaultAPIFactory: VaultAPIFactory;

  private logger: IFullLogger;

  constructor(private environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }

  public getAPI(vaultToken: string) {
    return this.vaultAPIFactory(vaultToken).ClientTaskQueueApi;
  }

  /**
   * @param change_state If true, set the state of all tasks in the reponse to 'in_progress'
   * @param states Filter results by state.
   * @param target_id Filter results by target_id.
   */
  public async list(
    vaultAccessToken: string,
    change_state: boolean = false,
    states: ClientTaskState[] = [ClientTaskState.Todo],
    target_id?: string,
    options?: { nextPageAfter?: string; perPage?: number }
  ): Promise<ClientTaskQueueResponse> {
    const result = await this.vaultAPIFactory(
      vaultAccessToken
    ).ClientTaskQueueApi.clientTaskQueueGet(
      options?.nextPageAfter,
      options?.perPage,
      change_state,
      target_id,
      states
    );

    if (resultHasNext(result) && options?.perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  public async listAll(
    vaultAccessToken: string,
    change_state: boolean = false,
    states: ClientTaskState[] = [ClientTaskState.Todo],
    target_id?: string
  ): Promise<ClientTask[]> {
    const api = this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi;
    return getAllPaged(cursor =>
      api.clientTaskQueueGet(cursor, undefined, change_state, target_id, states)
    )
      .then(reducePages)
      .then(result => result.client_tasks);
  }

  /**
   * Count all tasks that have state either 'todo' or 'in_progress'.
   * May make multiple API calls, depending on number of tasks.
   */
  public async countOutstandingTasks(vaultAccessToken: string): Promise<IOutstandingClientTasks> {
    const allTasks = await this.listAll(vaultAccessToken, false, [
      ClientTaskState.Todo,
      ClientTaskState.InProgress,
    ]);

    const initialCount = { todo: 0, in_progress: 0 };
    const result = allTasks.reduce((acc, task) => {
      if (task.state === ClientTaskState.Todo) {
        acc.todo += 1;
      } else if (task.state === ClientTaskState.InProgress) {
        acc.in_progress += 1;
      }
      return acc;
    }, initialCount);

    return result;
  }

  /**
   * Execute the given ClientTasks, updating their state in the API.
   * Currently, the only implemented task is 'update_item_share'.
   *
   * ClientTask state is set to 'in_progress' once execution begins.
   * Any tasks with state 'in_progress' or 'done' will raise an exception.
   * Tasks with state 'failed' will be retried.
   *
   * No tasks are initiated if any one of the tasks is unrecognized or cannot be started.
   * @param tasks ClientTasks to be executed. Each must have state 'todo' or 'failed'.
   * @param authData
   */
  public async execute(tasks: ClientTask[], authData: AuthData): Promise<IClientTaskExecResult> {
    this.logger.log(`Executing ${tasks.length} tasks`);

    for (const task of tasks) {
      if (task.work_type !== 'update_item_shares') {
        throw new MeecoServiceError(
          `Do not know how to execute ClientTask of type ${task.work_type}`
        );
      }

      if (task.state === ClientTaskState.InProgress || task.state === ClientTaskState.Done) {
        throw new MeecoServiceError(
          `Cannot execute ${task.work_type} task ${task.id} because it is already ${task.state}`
        );
      }
    }

    const updateSharesTasksResult: IClientTaskExecResult = await this.updateSharesClientTasks(
      tasks,
      authData
    );

    return updateSharesTasksResult;
  }

  /**
   * In this ClientTask, the target_id points to an Item which has been updated by the owner and so the owner must re-encrypt
   * the Item with each of the shared public keys.
   * @param listOfClientTasks A list of update_item_shares tasks to run.
   * @param authData
   */
  private async updateSharesClientTasks(
    tasks: ClientTask[],
    authData: AuthData
  ): Promise<IClientTaskExecResult> {
    const shareService = new ShareService(this.environment, this.logger.log);

    const taskReport: IClientTaskExecResult = {
      completed: [],
      failed: [],
    };

    const runTask = async (task: ClientTask) => {
      try {
        await shareService.updateSharedItem(authData, task.target_id);
        task.state = ClientTaskState.Done;
        taskReport.completed.push(task);
      } catch (error) {
        this.logger.warn(`Task with id=${task.id} failed!`);
        task.state = ClientTaskState.Failed;
        taskReport.failed.push({ ...task, failureReason: error?.body });
      }
    };

    // Set all tasks to in_progress
    await this.vaultAPIFactory(authData.vault_access_token).ClientTaskQueueApi.clientTaskQueuePut({
      client_tasks: tasks.map(({ id }) => ({ id, state: ClientTaskState.InProgress })),
    });
    this.logger.log('Set: in_progress');

    await Promise.all(tasks.map(runTask));

    // now update the tasks in the API
    this.logger.log(`Task run completed, updating.`);

    const allTasks = taskReport.completed
      .concat(taskReport.failed)
      .map(({ id, state, report }) => ({ id, state, report }));

    await this.vaultAPIFactory(authData.vault_access_token).ClientTaskQueueApi.clientTaskQueuePut({
      client_tasks: allTasks,
    });

    return taskReport;
  }
}

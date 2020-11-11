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

/**
 * A ClientTask represents a task the client is supposed to perform.
 */
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

export class ClientTaskQueueService {
  private vaultAPIFactory: VaultAPIFactory;

  private log: IFullLogger;

  constructor(private environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.log = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.log = toFullLogger(logger);
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
      this.log.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  public async listAll(
    vaultAccessToken: string,
    change_state: boolean = true,
    states: ClientTaskState[] = [ClientTaskState.Todo],
    target_id?: string
  ): Promise<ClientTaskQueueResponse> {
    const api = this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi;
    return getAllPaged(cursor =>
      api.clientTaskQueueGet(cursor, undefined, change_state, target_id, states)
    ).then(reducePages);
  }

  public async countOutstandingTasks(vaultAccessToken: string): Promise<IOutstandingClientTasks> {
    const api = this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi;
    const todoTasks = await api.clientTaskQueueGet(undefined, undefined, true, undefined, [
      ClientTaskState.Todo,
    ]);

    const inProgressTasks = await api.clientTaskQueueGet(undefined, undefined, true, undefined, [
      ClientTaskState.InProgress,
    ]);

    return {
      todo: todoTasks.client_tasks.length,
      in_progress: inProgressTasks.client_tasks.length,
    };
  }

  public async executeClientTasks(
    listOfClientTasks: ClientTask[],
    authData: AuthData
  ): Promise<IClientTaskExecResult> {
    for (const task of listOfClientTasks) {
      if (task.work_type !== 'update_item_shares') {
        throw new MeecoServiceError(
          `Do not know how to execute ClientTask of type ${task.work_type}`
        );
      }
    }

    const updateSharesTasksResult: IClientTaskExecResult = await this.updateSharesClientTasks(
      listOfClientTasks,
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
  public async updateSharesClientTasks(
    listOfClientTasks: ClientTask[],
    authData: AuthData
  ): Promise<IClientTaskExecResult> {
    const shareService = new ShareService(this.environment);

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
        task.state = ClientTaskState.Failed;
        taskReport.failed.push({ ...task, failureReason: error });
      }
    };

    await Promise.all(listOfClientTasks.map(runTask));

    // now update the tasks in the API
    const allTasks = taskReport.completed
      .concat(taskReport.failed)
      .map(({ id, state, report }) => ({ id, state, report }));
    this.vaultAPIFactory(authData.vault_access_token).ClientTaskQueueApi.clientTaskQueuePut({
      client_tasks: allTasks,
    });

    return taskReport;
  }
}

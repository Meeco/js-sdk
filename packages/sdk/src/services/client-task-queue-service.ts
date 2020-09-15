import { ClientTask, ClientTaskQueueResponse } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { Environment } from '../models/environment';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';

/**
 * A ClientTask represents a task the client is supposed to perform.
 */
export class ClientTaskQueueService {
  private vaultAPIFactory: VaultAPIFactory;

  constructor(environment: Environment) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
  }

  public list(
    vaultAccessToken: string,
    supressChangingState: boolean = true,
    state: State = State.Todo,
    options?: {
      nextPageAfter?: string;
      perPage?: number;
    }
  ): Promise<ClientTaskQueueResponse> {
    return this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi.clientTaskQueueGet(
      options?.nextPageAfter,
      options?.perPage,
      supressChangingState,
      state
    );
  }

  public async countOutstandingTasks(vaultAccessToken: string): Promise<IOutstandingClientTasks> {
    const todoTasks = await this.vaultAPIFactory(
      vaultAccessToken
    ).ClientTaskQueueApi.clientTaskQueueGet(undefined, undefined, true, State.Todo);

    const inProgressTasks = await this.vaultAPIFactory(
      vaultAccessToken
    ).ClientTaskQueueApi.clientTaskQueueGet(undefined, undefined, true, State.InProgress);

    return {
      todo: todoTasks.client_tasks.length,
      in_progress: inProgressTasks.client_tasks.length,
    };
  }

  public async executeClientTasks(
    listOfClientTasks: ClientTask[],
    authData: AuthData
  ): Promise<{ completedTasks: ClientTask[]; failedTasks: ClientTask[] }> {
    const remainingClientTasks: ClientTask[] = [];
    const itemUpdateSharesTasks: ClientTask[] = [];
    for (const task of listOfClientTasks) {
      switch (task.work_type) {
        case 'update_item_shares':
          itemUpdateSharesTasks.push(task);
          break;
        default:
          remainingClientTasks.push(task);
          break;
      }
    }
    if (remainingClientTasks.length) {
      throw new Error(
        `Do not know how to execute ClientTask of type ${remainingClientTasks[0].work_type}`
      );
    }
    const [updateSharesTasksResult]: Array<{
      completedTasks: ClientTask[];
      failedTasks: ClientTask[];
    }> = await Promise.all([this.updateSharesClientTasks(itemUpdateSharesTasks, authData)]);

    return updateSharesTasksResult;
  }

  public async updateSharesClientTasks(
    listOfClientTasks: ClientTask[],
    authData: AuthData
  ): Promise<{ completedTasks: ClientTask[]; failedTasks: ClientTask[] }> {
    const sharesApi = this.vaultAPIFactory(authData.vault_access_token).SharesApi;

    const sharesToUpdate = await Promise.all(
      listOfClientTasks.map(task => sharesApi.itemsIdSharesGet(task.target_id))
    );

    return { completedTasks: [], failedTasks: [] };
  }
}

export enum State {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
  Failed = 'failed',
}

export interface IOutstandingClientTasks {
  todo: number;
  in_progress: number;
}

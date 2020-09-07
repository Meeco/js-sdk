import { ClientTaskQueueResponse } from '@meeco/vault-api-sdk';
import { Environment } from '../models/environment';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { getAllPaged, reducePages } from './paged-service';

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
    nextPageAfter?: string,
    perPage?: number
  ): Promise<ClientTaskQueueResponse> {
    return this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi.clientTaskQueueGet(
      nextPageAfter,
      perPage,
      supressChangingState,
      state
    );
  }

  public async listAll(
    vaultAccessToken: string,
    supressChangingState: boolean = true,
    state: State = State.Todo
  ): Promise<ClientTaskQueueResponse> {
    const api = this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi;
    return getAllPaged(cursor => api.clientTaskQueueGet(
      cursor,
      undefined,
      supressChangingState,
      state
    )).then(reducePages);
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

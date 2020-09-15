import { ClientTaskQueueResponse } from '@meeco/vault-api-sdk';
import { Environment } from '../models/environment';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';

/**
 * A ClientTask represents a task the client is supposed to perform.
 */
export class ClientTaskQueueService {
  private vaultAPIFactory: VaultAPIFactory;
  private log: IFullLogger;

  constructor(environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.log = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.log = toFullLogger(logger);
  }

  public async list(
    vaultAccessToken: string,
    supressChangingState: boolean = true,
    state: State = State.Todo,
    nextPageAfter?: string,
    perPage?: number
  ): Promise<ClientTaskQueueResponse> {
    const result = await this.vaultAPIFactory(
      vaultAccessToken
    ).ClientTaskQueueApi.clientTaskQueueGet(nextPageAfter, perPage, supressChangingState, state);

    if (resultHasNext(result) && perPage === undefined) {
      // TODO-- should pass a warning logger!
      this.log.warn('Some results omitted, but page limit was not explicitly set');
    }

    return result;
  }

  public async listAll(
    vaultAccessToken: string,
    supressChangingState: boolean = true,
    state: State = State.Todo
  ): Promise<ClientTaskQueueResponse> {
    const api = this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi;
    return getAllPaged(cursor =>
      api.clientTaskQueueGet(cursor, undefined, supressChangingState, state)
    ).then(reducePages);
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

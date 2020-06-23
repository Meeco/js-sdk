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

  public list(vaultAccessToken: string, state: State = State.Todo) {
    return this.vaultAPIFactory(vaultAccessToken).ClientTaskQueueApi.clientTaskQueueGet(
      undefined,
      undefined,
      true,
      state
    );
  }
}

export enum State {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
  Failed = 'failed'
}

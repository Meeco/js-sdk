import { ClientTask, ClientTaskQueueResponse } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';
import { getAllPaged, reducePages, resultHasNext } from '../util/paged';
import cryppo from './cryppo-service';
import { ItemService } from './item-service';
import { ShareService } from './share-service';

/**
 * A ClientTask represents a task the client is supposed to perform.
 */
interface IfailedClientTask extends ClientTask {
  failureReason: any;
}

export class ClientTaskQueueService {
  private vaultAPIFactory: VaultAPIFactory;
  private cryppo = (<any>global).cryppo || cryppo;

  private log: IFullLogger;

  constructor(private environment: Environment, log: Logger = noopLogger) {
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
    state: State = State.Todo,
    options?: {
      nextPageAfter?: string;
      perPage?: number;
    }
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
      failedTasks: IfailedClientTask[];
    }> = await Promise.all([this.updateSharesClientTasks(itemUpdateSharesTasks, authData)]);

    return updateSharesTasksResult;
  }

  public async updateSharesClientTasks(
    listOfClientTasks: ClientTask[],
    authData: AuthData
  ): Promise<{ completedTasks: ClientTask[]; failedTasks: IfailedClientTask[] }> {
    const sharesApi = this.vaultAPIFactory(authData.vault_access_token).SharesApi;
    const itemsApi = this.vaultAPIFactory(authData.vault_access_token).ItemApi;

    const taskReports = await Promise.all(
      listOfClientTasks.map(async task => {
        const taskReport = {
          completedTasks: <ClientTask[]>[],
          failedTasks: <IfailedClientTask[]>[],
        };
        try {
          const [item, shares] = await Promise.all([
            itemsApi.itemsIdGet(task.target_id),
            sharesApi.itemsIdSharesGet(task.target_id),
          ]);
          const decryptedSlots = await ItemService.decryptAllSlots(
            item.slots,
            authData.data_encryption_key
          );
          const dek = this.cryppo.generateRandomKey();
          const newEncryptedSlots = await new ShareService(
            this.environment
          ).convertSlotsToEncryptedValuesForShare(decryptedSlots, EncryptionKey.fromRaw(dek));
          const nestedSlotValues: any[] = shares.shares.map(share => {
            return newEncryptedSlots.map(newValue => {
              return { ...newValue, share_id: share.id };
            });
          });
          const slotValues = [].concat.apply([], nestedSlotValues);
          const shareDeks = await Promise.all(
            shares.shares.map(async share => {
              const encryptedDek = await this.cryppo.encryptWithPublicKey({
                publicKeyPem: share.public_key,
                data: dek,
              });
              return { share_id: share.id, dek: encryptedDek.serialized };
            })
          );
          const clientTasks = [{ id: task.id, state: 'done', report: task.report }];
          await sharesApi.itemsIdSharesPut(task.target_id, {
            slot_values: slotValues,
            share_deks: shareDeks,
            client_tasks: clientTasks,
          });
          taskReport.completedTasks.push(task);
        } catch (error) {
          taskReport.failedTasks.push({ ...task, failureReason: error });
        }
        return taskReport;
      })
    );

    const combinedTaskReports = taskReports.reduce((accum, current) => {
      accum.completedTasks.concat(current.completedTasks);
      accum.failedTasks.concat(current.failedTasks);
      return accum;
    });

    return combinedTaskReports;
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

import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import cryppo from '../services/cryppo-service';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory,
} from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';

/** Common interface for GET endpoints which are paginated */
export interface IPageOptions {
  nextPageAfter?: string;
  perPage?: number;
}

export interface IVaultToken {
  vault_access_token: string;
}

export interface IDEK {
  data_encryption_key: EncryptionKey;
}

export interface IKEK {
  key_encryption_key: EncryptionKey;
}

export interface IKeystoreToken {
  keystore_access_token: string;
}

export interface ICreate<T> {
  create(args: any): Promise<T>;
}

export interface IList<T> {
  list(...args: any[]): Promise<T>;
  listAll(...args: any[]): Promise<T>;
  // list(vaultAccessToken: string,supressChangingState: boolean = true,state: State = State.Todo,options?: { nextPageAfter?: string; perPage?: number }
  // list(vaultAccessToken: string, dek: EncryptionKey,nextPageAfter?: string,perPage?: number)
  // templateType, shareType

  // list(token: string, options?: IPageOptions, ...args: any[]): Promise<T[]>;
  // list(args: VaultToken & IPageOptions & any): Promise<T[]>;
}

/**
 * Abstract SDK Service.
 */
export default abstract class Service<API> {
  protected static readonly cryppo = (<any>global).cryppo || cryppo;
  protected vaultAPIFactory: VaultAPIFactory;
  protected keystoreAPIFactory: KeystoreAPIFactory;
  protected logger: IFullLogger;

  /**
   * Services ususally wrap a single API object, this makes it explicit and accessible.
   */
  public abstract getAPI(token: string): API;

  constructor(protected environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.keystoreAPIFactory = keystoreAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }

  // TODO replace IBaseApi like this:
  // public abstract api(token: string): T;
}

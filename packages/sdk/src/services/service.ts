import { Environment } from '../models/environment';
import cryppo from '../services/cryppo-service';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory,
} from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';

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
}

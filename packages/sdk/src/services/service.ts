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
export default class Service {
  protected static readonly cryppo = (<any>global).cryppo || cryppo;
  protected vaultAPIFactory: VaultAPIFactory;
  protected keystoreAPIFactory: KeystoreAPIFactory;
  protected logger: IFullLogger;

  constructor(protected environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.keystoreAPIFactory = keystoreAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }
}

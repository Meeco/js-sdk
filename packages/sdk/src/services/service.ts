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
  protected readonly cryppo = (<any>global).cryppo || cryppo;
  protected vaultApiFactory: VaultAPIFactory;
  protected keystoreApiFactory: KeystoreAPIFactory;
  protected logger: IFullLogger;

  constructor(protected environment: Environment, log: Logger = noopLogger) {
    this.vaultApiFactory = vaultAPIFactory(environment);
    this.keystoreApiFactory = keystoreAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }
}

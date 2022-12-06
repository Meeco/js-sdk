import { Environment } from '../models/environment';
import { SymmetricKey } from '../models/symmetric-key';
import {
  IdentityNetworkAPIFactory,
  identityNetworkAPIFactory,
  KeystoreAPIFactory,
  keystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory,
  VCAPIFactory,
  vcAPIFactory,
} from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';

/** Common interface for GET endpoints which are paginated */
export interface IPageOptions {
  nextPageAfter?: string;
  perPage?: number;
}

export interface IVaultToken {
  vault_access_token: string;
  delegation_id?: string;
  oidc_token?: string;
  organisation_id?: string;
  srt?: string;
}

export interface IDEK {
  data_encryption_key: SymmetricKey;
}

export interface IKEK {
  key_encryption_key: SymmetricKey;
}

export interface IKeystoreToken {
  keystore_access_token: string;
  delegation_id?: string;
  oidc_token?: string;
  organisation_id?: string;
  srt?: string;
}

export interface IIdentityNetworkToken {
  identity_network_access_token: string;
}

export interface IVCToken {
  vc_access_token: string;
}

/**
 * Abstract SDK Service.
 */
export default abstract class Service<API> {
  protected vaultAPIFactory: VaultAPIFactory;
  protected keystoreAPIFactory: KeystoreAPIFactory;
  protected identityNetworkAPIFactory: IdentityNetworkAPIFactory;
  protected vcAPIFactory: VCAPIFactory;
  protected logger: IFullLogger;

  /**
   * Services ususally wrap a single API object, this makes it explicit and accessible.
   */
  public abstract getAPI(
    token: IVaultToken | IKeystoreToken | IIdentityNetworkToken | IVCToken
  ): API;

  constructor(protected environment: Environment, log: Logger = noopLogger) {
    this.vaultAPIFactory = vaultAPIFactory(environment);
    this.keystoreAPIFactory = keystoreAPIFactory(environment);
    this.identityNetworkAPIFactory = identityNetworkAPIFactory(environment);
    this.vcAPIFactory = vcAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }
}

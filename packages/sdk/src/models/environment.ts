interface IAPIConfig {
  url: string;
  subscription_key: string;
}

/**
 * Environment configuration - used to point to the desired API host (e.g sandbox or production) and configure
 * your subscription keys for API access.
 */
export class Environment {
  public vault: IAPIConfig;
  public keystore: IAPIConfig;
  public identityNetwork: IAPIConfig;
  public vc: IAPIConfig;

  constructor(config: {
    vault: IAPIConfig;
    keystore: IAPIConfig & { provider_api_key: string }; // TODO: check if this one is still needed
    identityNetwork: IAPIConfig;
    vc: IAPIConfig;
  }) {
    this.vault = config.vault;
    this.keystore = config.keystore;
    this.identityNetwork = config.identityNetwork;
    this.vc = config.vc;
  }
}

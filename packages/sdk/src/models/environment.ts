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

  constructor(config: {
    vault: IAPIConfig;
    keystore: IAPIConfig & { provider_api_key: string }; // TODO: check if this one is still needed
    identityNetwork: IAPIConfig;
  }) {
    this.vault = config.vault;
    this.keystore = config.keystore;
    this.identityNetwork = config.identityNetwork;
  }
}

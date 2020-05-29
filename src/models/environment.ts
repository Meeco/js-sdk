interface IAPIConfig {
  url: string;
  subscription_key: string;
}

export class Environment {
  public vault: IAPIConfig;
  public keystore: IAPIConfig;
  public passphrase: IAPIConfig;
  public downloader: IAPIConfig;

  constructor(config: {
    vault: IAPIConfig;
    keystore: IAPIConfig & { provider_api_key: string }; // TODO: check if this one is still needed
    passphrase: IAPIConfig;
    downloader: IAPIConfig;
  }) {
    this.vault = config.vault;
    this.keystore = config.keystore;
    this.passphrase = config.passphrase;
    this.downloader = config.downloader;
  }
}

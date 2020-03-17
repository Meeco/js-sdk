export interface IEnvironment {
  vault: {
    url: string;
    subscription_key: string;
  };
  keystore: {
    url: string;
    subscription_key: string;
    provider_api_key: string;
  };
  passphrase: {
    url: string;
    subscription_key: string;
  };
  downloader: {
    url: string;
  };
}

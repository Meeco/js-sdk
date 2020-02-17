export interface IEnvironment {
  vault: {
    url: string;
  };
  keystore: {
    url: string;
    provider_api_key: string;
  };
  passphrase: {
    url: string;
  };
  downloader: {
    url: string;
  };
}

import { Configuration, ConfigurationParameters } from '@meeco/vault-api-sdk';

/**
 * @param vault_access_token Meeco Vault Bearer Token.
 * @param delegation_id Original User id of User acting as a delegate.
 * @param subscription_key Meeco API Subscription key.
 */
export interface IFileStorageAuthConfiguration {
  vault_access_token?: string;
  delegation_id?: string;
  subscription_key?: string;
  oidc_token?: string;
}

export function buildApiConfig(
  auth: IFileStorageAuthConfiguration,
  vaultUrl: string,
  fetchApi?: any
): Configuration {
  const headers = getHeaders(auth);

  const configParams: ConfigurationParameters = {
    basePath: vaultUrl,
    headers,
  };
  if (fetchApi) {
    configParams['fetchApi'] = fetchApi;
  }
  return new Configuration(configParams);
}

/**
 * Extract HTTP headers from an `IFileStorageAuthConfiguration` object.
 */
export function getHeaders(auth: IFileStorageAuthConfiguration): { [header: string]: string } {
  const headers = {};
  if (auth.delegation_id) {
    headers['Meeco-Delegation-Id'] = auth.delegation_id;
  }

  if (auth.subscription_key) {
    headers['Meeco-Subscription-Key'] = auth.subscription_key;
  }

  if (auth.vault_access_token) {
    headers['Authorization'] = auth.vault_access_token;
  }

  if (auth.oidc_token) {
    headers['authorizationoidc2'] = auth.oidc_token;
  }

  return headers;
}

/**
 * When redirecting to Azure storage "Authorization" header must not be present.
 */
export function getBlobHeaders(auth: IFileStorageAuthConfiguration): { [header: string]: string } {
  // TODO: unclear if any other headers should be present either
  const headers = {};
  if (auth.delegation_id) {
    headers['Meeco-Delegation-Id'] = auth.delegation_id;
  }

  if (auth.subscription_key) {
    headers['Meeco-Subscription-Key'] = auth.subscription_key;
  }

  if (auth.vault_access_token) {
    headers['Authorization'] = auth.vault_access_token;
  }

  if (auth.oidc_token) {
    headers['authorizationoidc2'] = auth.oidc_token;
  }

  return headers;
}

import { OrganizationsManagingOrganizationsApi } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { vaultAPIFactory } from '../util/api-factory';

/**
 * Manage organizations from the API.
 */
export class OrganizationsService {
  private api: OrganizationsManagingOrganizationsApi;

  constructor(environment: Environment, vaultAccessToken: string) {
    this.api = vaultAPIFactory(environment)(vaultAccessToken).OrganizationsManagingOrganizationsApi;
  }

  public async getLogin(id: string): Promise<AuthData> {
    const result = await this.api.organizationsIdLoginPost(id);
    return new AuthData({
      secret: '',
      keystore_access_token: '',
      vault_access_token: result.access_token,
      data_encryption_key: EncryptionKey.fromRaw(''),
      key_encryption_key: EncryptionKey.fromRaw(''),
      passphrase_derived_key: EncryptionKey.fromRaw('')
    });
  }
}

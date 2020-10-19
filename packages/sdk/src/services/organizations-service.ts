import {
  OrganizationsManagingOrganizationsApi,
  PostOrganizationRequest,
} from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { vaultAPIFactory } from '../util/api-factory';
import { Logger, noopLogger } from '../util/logger';
import Service from './service';

/**
 * Manage organizations from the API.
 */
export class OrganizationsService extends Service {
  private api: OrganizationsManagingOrganizationsApi;

  constructor(environment: Environment, vaultAccessToken: string, log: Logger = noopLogger) {
    super(environment, log);
    this.api = vaultAPIFactory(environment)(vaultAccessToken).OrganizationsManagingOrganizationsApi;
  }

  public async getLogin(id: string, privateKey: string): Promise<AuthData> {
    const result = await this.api.organizationsIdLoginPost(id);
    const decryptedVaultSessionToken = await Service.cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: privateKey,
      serialized: result.encrypted_access_token,
    });
    return new AuthData({
      secret: '',
      keystore_access_token: '',
      vault_access_token: decryptedVaultSessionToken,
      data_encryption_key: EncryptionKey.fromRaw(''),
      key_encryption_key: EncryptionKey.fromRaw(''),
      passphrase_derived_key: EncryptionKey.fromRaw(''),
    });
  }

  public async create(organization: PostOrganizationRequest) {
    const rsaKeyPair = await Service.cryppo.generateRSAKeyPair(4096);
    organization.public_key = rsaKeyPair.publicKey;
    const result = await this.api.organizationsPost(organization);
    return {
      organization: result.organization,
      privateKey: rsaKeyPair.privateKey,
      publicKey: rsaKeyPair.publicKey,
    };
  }
}

export enum OrganizationMemberRoles {
  Admin = 'admin',
  Owner = 'owner',
}

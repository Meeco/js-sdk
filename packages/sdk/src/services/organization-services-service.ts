import { OrganizationsManagingServicesApi, PostServiceRequest } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { Logger, noopLogger } from '../util/logger';
import Service, { IVaultToken } from './service';

/**
 * Manage organizations from the API.
 */
export class OrganizationServicesService extends Service<OrganizationsManagingServicesApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token.vault_access_token).OrganizationsManagingServicesApi;
  }

  constructor(
    environment: Environment,
    private vaultAccessToken: string,
    log: Logger = noopLogger
  ) {
    super(environment, log);
  }

  public async getLogin(
    organizationId: string,
    serviceId: string,
    privateKey: string
  ): Promise<AuthData> {
    const result = await this.vaultAPIFactory(
      this.vaultAccessToken
    ).OrganizationsManagingServicesApi.organizationsOrganizationIdServicesIdLoginPost(
      organizationId,
      serviceId
    );
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

  public async create(organizationId: string, service: PostServiceRequest) {
    const rsaKeyPair = await Service.cryppo.generateRSAKeyPair(4096);
    service.public_key = rsaKeyPair.publicKey;
    const result = await this.vaultAPIFactory(
      this.vaultAccessToken
    ).OrganizationsManagingServicesApi.organizationsOrganizationIdServicesPost(organizationId, {
      service,
    });
    return {
      service: result.service,
      privateKey: rsaKeyPair.privateKey,
      publicKey: rsaKeyPair.publicKey,
    };
  }
}

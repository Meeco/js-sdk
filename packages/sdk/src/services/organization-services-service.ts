import { OrganizationsManagingServicesApi, PostServiceRequest } from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import { Environment } from '../models/environment';
import RSAPrivateKey from '../models/rsa-private-key';
import { Logger, noopLogger } from '../util/logger';
import Service, { IVaultToken } from './service';

/**
 * Manage organization services from the API.
 */
export class OrganizationServicesService extends Service<OrganizationsManagingServicesApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).OrganizationsManagingServicesApi;
  }

  constructor(
    environment: Environment,
    private credentials: IVaultToken,
    log: Logger = noopLogger
  ) {
    super(environment, log);
  }

  public async getLogin(
    organizationId: string,
    serviceId: string,
    privateKey: string
  ): Promise<IVaultToken> {
    const orgKey = new RSAPrivateKey(privateKey);

    this.logger.log('Logging in');
    const result = await this.vaultAPIFactory(
      this.credentials
    ).OrganizationsManagingServicesApi.organizationsOrganizationIdServicesIdLoginPost(
      organizationId,
      serviceId
    );

    const decryptedVaultSessionToken = await orgKey.decryptToken(result.encrypted_access_token);
    return {
      vault_access_token: decryptedVaultSessionToken,
    };
  }

  public async create(organizationId: string, service: PostServiceRequest) {
    const rsaKeyPair = await DecryptedKeypair.generate();
    service.public_key = rsaKeyPair.publicKey.key;
    const result = await this.vaultAPIFactory(
      this.credentials
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

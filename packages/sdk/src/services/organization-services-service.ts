import { OrganizationsManagingServicesApi, PostServiceRequest } from '@meeco/vault-api-sdk';
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
  ): Promise<IVaultToken> {
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
    return {
      vault_access_token: decryptedVaultSessionToken,
    };
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

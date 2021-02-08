import {
  Organization,
  OrganizationsManagingOrganizationsApi,
  Service as APIService,
} from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import RSAPrivateKey from '../models/rsa-private-key';
import { getAllPaged, reducePages } from '../util/paged';
import Service, { IVaultToken } from './service';

/**
 * Manage organizations from the API.
 */
export class OrganizationService extends Service<OrganizationsManagingOrganizationsApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).OrganizationsManagingOrganizationsApi;
  }

  /**
   * Login as an Organization member, getting the Organization's vault session token.
   * @param credentials Organization member's vault token
   * @param privateKey Used to decrypt the stored token
   */
  public async getOrganizationToken(
    credentials: IVaultToken,
    organizationId: string,
    privateKey: string
  ): Promise<IVaultToken> {
    const orgKey = new RSAPrivateKey(privateKey);
    const result = await this.vaultAPIFactory(
      credentials
    ).OrganizationsManagingOrganizationsApi.organizationsIdLoginPost(organizationId);

    const decryptedVaultSessionToken = await orgKey.decryptToken(result.encrypted_access_token);

    return { vault_access_token: decryptedVaultSessionToken };
  }

  /**
   * Request creation of an Organization. The Organization has a key pair that is used to
   * encrypt session tokens, so only members with the private key can login on behalf of the
   * Organization. This is `privateKey` in the result; it must be stored securely, if lost
   * you cannot log in to the Organization.
   */
  public async create(
    credentials: IVaultToken,
    name: string,
    info: Partial<{ description: string; url: string; email: string }> = {}
  ) {
    const rsaKeyPair = await DecryptedKeypair.generate();
    const public_key = rsaKeyPair.publicKey;

    // must have name and public_key
    // notice that public_key is used to encrypt the session token of the org
    const result = await this.vaultAPIFactory(
      credentials
    ).OrganizationsManagingOrganizationsApi.organizationsPost({
      name,
      public_key: public_key.key,
      ...info,
    });

    return {
      organization: result.organization,
      privateKey: rsaKeyPair.privateKey.pem,
      publicKey: rsaKeyPair.publicKey.key,
    };
  }

  /**
   * @param mode If unspecified returns all validated organizations; `requested` by user, or user `member` orgs can be given too.
   */
  public async listAll(
    credentials: IVaultToken,
    mode?: 'requested' | 'member'
  ): Promise<{ organizations: Organization[]; services: APIService[] }> {
    const api = this.vaultAPIFactory(credentials).OrganizationsForVaultUsersApi;

    return getAllPaged(cursor => api.organizationsGet(mode, cursor))
      .then(reducePages)
      .then(({ organizations, services }) => ({
        organizations,
        services,
      }));
  }
}

export enum OrganizationMemberRoles {
  Admin = 'admin',
  Owner = 'owner',
}

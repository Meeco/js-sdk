import {
  Invitation,
  ListOrganizationMemberResponse,
  OrganizationsManagingMembersApi,
} from '@meeco/vault-api-sdk';
import { getAllPaged, reducePagesTakeLast } from '../util/paged';
import { OrganizationMemberRoles } from './organization-service';
import Service, { IPageOptions, IVaultToken } from './service';

/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService extends Service<OrganizationsManagingMembersApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token.vault_access_token).OrganizationsManagingMembersApi;
  }

  /**
   * Invite a Vault user to become an Organization member.
   * @param organizationAgentPublicKey
   * @param role Role of the new member
   */
  public async createInvite(
    credentials: IVaultToken,
    organizationAgentPublicKey: string,
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ): Promise<Invitation> {
    this.logger.log('Creating invitation request');
    return this.vaultAPIFactory(credentials.vault_access_token)
      .InvitationApi.invitationsPost({
        public_key: {
          keypair_external_id: 'org-agent-keypair',
          public_key: organizationAgentPublicKey,
        },
        invitation: {
          organization_member_role: role,
        },
      })
      .then(result => result.invitation);
  }

  public async updateMemberRole(
    credentials: IVaultToken,
    organizationId: string,
    userId: string,
    newRole: OrganizationMemberRoles
  ) {
    return this.vaultAPIFactory(
      credentials.vault_access_token
    ).OrganizationsManagingMembersApi.organizationsOrganizationIdMembersIdPut(
      organizationId,
      userId,
      {
        organization_member: {
          role: newRole,
        },
      }
    );
  }

  public async list(
    credentials: IVaultToken,
    organizationId: string,
    options?: IPageOptions
  ): Promise<ListOrganizationMemberResponse> {
    return this.vaultAPIFactory(
      credentials.vault_access_token
    ).OrganizationsManagingMembersApi.organizationsOrganizationIdMembersGet(
      organizationId,
      options?.nextPageAfter,
      options?.perPage
    );
  }

  public async listAll(
    credentials: IVaultToken,
    organizationId: string
  ): Promise<ListOrganizationMemberResponse> {
    const api = this.vaultAPIFactory(credentials.vault_access_token)
      .OrganizationsManagingMembersApi;
    return getAllPaged(cursor =>
      api.organizationsOrganizationIdMembersGet(organizationId, cursor)
    ).then(reducePagesTakeLast);
  }
}

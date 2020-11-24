import { OrganizationsManagingMembersApi } from '@meeco/vault-api-sdk';
import { OrganizationMemberRoles } from './organizations-service';
import Service, { IVaultToken } from './service';

/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService extends Service<OrganizationsManagingMembersApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token.vault_access_token).OrganizationsManagingMembersApi;
  }

  public async createInvite(
    credentials: IVaultToken,
    organizationAgentPublicKey: string,
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ) {
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
}

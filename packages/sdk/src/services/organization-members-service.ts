import { OrganizationsManagingMembersApi } from '@meeco/vault-api-sdk';
import { OrganizationMemberRoles } from './organizations-service';
import Service from './service';

/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService extends Service<OrganizationsManagingMembersApi> {
  public getAPI(token: string) {
    return this.vaultAPIFactory(token).OrganizationsManagingMembersApi;
  }

  public async createInvite(
    vaultAccessToken: string,
    organizationAgentPublicKey: string,
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ) {
    this.logger.log('Creating invitation request');
    return await this.vaultAPIFactory(vaultAccessToken)
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

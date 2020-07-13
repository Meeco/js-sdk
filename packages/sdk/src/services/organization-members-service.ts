import { Environment } from '../models/environment';
import { vaultAPIFactory, VaultAPIFactory } from '../util/api-factory';
/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService {
  private vaultApiFactory: VaultAPIFactory;

  constructor(environment: Environment, private log: (message: string) => void = () => {}) {
    this.vaultApiFactory = vaultAPIFactory(environment);
  }

  public async createInvite(
    vaultAccessToken: string,
    organizationAgentPublicKey: string,
    recipientName: string = '',
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ) {
    // this will be deleted as soon as we make them not mandatory in API
    const dummy_keypair_external_id = '00000000-0000-0000-0000-000000000000';
    const dummy_recipientName = '[serialized][rsa_encrypted][with --PUBLIC_KEY--ABCD]';

    this.log('Creating invitation request');
    return await this.vaultApiFactory(vaultAccessToken)
      .InvitationApi.invitationsPost({
        public_key: {
          keypair_external_id: dummy_keypair_external_id,
          public_key: organizationAgentPublicKey
        },
        invitation: {
          encrypted_recipient_name: dummy_recipientName,
          organization_member_role: role
        }
      })
      .then(result => result.invitation);
  }
}

export enum OrganizationMemberRoles {
  Admin = 'admin',
  Owner = 'owner'
}

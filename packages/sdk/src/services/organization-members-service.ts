import { Environment } from '../models/environment';
import { vaultAPIFactory, VaultAPIFactory } from '../util/api-factory';
import cryppo from './cryppo-service';
/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService {
  private vaultApiFactory: VaultAPIFactory;

  // for mocking during testing
  private cryppo = (<any>global).cryppo || cryppo;

  constructor(environment: Environment, private log: (message: string) => void = () => {}) {
    this.vaultApiFactory = vaultAPIFactory(environment);
  }

  public async createInvite(
    vaultAccessToken: string,
    organizationAgentPublicKey: string,
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ) {
    this.log('Creating invitation request');
    return await this.vaultApiFactory(vaultAccessToken)
      .InvitationApi.invitationsPost({
        public_key: {
          public_key: organizationAgentPublicKey
        },
        invitation: {
          organization_member_role: role
        }
      })
      .then(result => result.invitation);
  }

  public async acceptInvite(vaultAccessToken: string, invitationToken: string) {
    const rsaKeyPair = await this.cryppo.generateRSAKeyPair(4096);
    const result = await this.vaultApiFactory(vaultAccessToken).ConnectionApi.connectionsPost({
      public_key: {
        public_key: rsaKeyPair.publicKey
      },
      connection: {
        invitation_token: invitationToken
      }
    });
    return {
      connection: result.connection,
      privateKey: rsaKeyPair.privateKey,
      publicKey: rsaKeyPair.publicKey
    };
  }
}

export enum OrganizationMemberRoles {
  Admin = 'admin',
  Owner = 'owner'
}

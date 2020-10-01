import { Environment } from '../models/environment';
import { vaultAPIFactory, VaultAPIFactory } from '../util/api-factory';
import { IFullLogger, Logger, noopLogger, toFullLogger } from '../util/logger';
/**
 * Manage organization members from the API.
 */
export class OrganizationMembersService {
  private vaultApiFactory: VaultAPIFactory;
  private logger: IFullLogger;

  constructor(environment: Environment, log: Logger = noopLogger) {
    this.vaultApiFactory = vaultAPIFactory(environment);
    this.logger = toFullLogger(log);
  }

  public setLogger(logger: Logger) {
    this.logger = toFullLogger(logger);
  }

  public async createInvite(
    vaultAccessToken: string,
    organizationAgentPublicKey: string,
    role: OrganizationMemberRoles = OrganizationMemberRoles.Admin
  ) {
    this.logger.log('Creating invitation request');
    return await this.vaultApiFactory(vaultAccessToken)
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

export enum OrganizationMemberRoles {
  Admin = 'admin',
  Owner = 'owner',
}

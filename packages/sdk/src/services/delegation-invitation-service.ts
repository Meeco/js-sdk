import { signWithPrivateKey } from '@meeco/cryppo';
import { DelegationInvitationApi } from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import Service, { IDEK, IKEK, IKeystoreToken, IVaultToken } from './service';

/**
 * Used for setting up delegation connections between Meeco User`s to allow the secure management of another users account
 */
export class DelegationInvitationService extends Service<DelegationInvitationApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).DelegationInvitationApi;
  }

  // Delegation connection Step 1 - Account Owner (Existing connection)
  public async createDelegationInvitation(
    credentials: IDEK & IKEK & IVaultToken & IKeystoreToken,
    vault_account_id: string,
    delegation_role: string,
    connection_id: string
  ) {
    const { delegation } = await this.keystoreAPIFactory(credentials).DelegationApi.delegationsPost(
      { vault_account_id, delegation_role }
    );

    const { delegation_invitation } = await this.vaultAPIFactory(
      credentials
    ).DelegationInvitationApi.delegationInvitationsPost({
      connection_id,
      delegation_role,
      delegation_token: delegation.delegation_token,
    });

    return delegation_invitation;
  }

  // Delegation connection Step 2 - Delegate
  public async acceptDelegationInvitation(
    credentials: IDEK & IKEK & IVaultToken & IKeystoreToken,
    delegationInvitationId: string
  ) {
    const { connection } = await this.vaultAPIFactory(
      credentials
    ).DelegationInvitationApi.delegationInvitationsIdAcceptPut(delegationInvitationId);

    const { keypair } = await this.keystoreAPIFactory(credentials).KeypairApi.keypairsIdGet(
      connection.own.user_keypair_external_id!
    );
    const connectionKey = await DecryptedKeypair.fromAPI(credentials.key_encryption_key, keypair);

    const delegationToken = this.getDelegationTokenFromConnection(connection);
    const delegate_signature = signWithPrivateKey(
      connectionKey.privateKey.pem,
      new TextEncoder().encode(delegationToken)
    ).serialized;

    await this.keystoreAPIFactory(credentials).DelegationApi.delegationsDelegationTokenClaimPost(
      delegationToken,
      { delegate_signature }
    );

    return connection;
  }

  private getDelegationTokenFromConnection(connection) {
    return (
      connection.own.integration_data?.delegation_token ||
      connection.the_other_user.integration_data?.delegation_token ||
      ''
    );
  }
}

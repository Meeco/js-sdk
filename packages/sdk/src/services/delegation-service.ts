import { bytesToBinaryString, encryptWithPublicKey, signWithPrivateKey } from '@meeco/cryppo';
import { Delegation } from '@meeco/keystore-api-sdk';
import { Connection, DelegationApi } from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import { SymmetricKey } from '../models/symmetric-key';
import { ConnectionService } from './connection-service';
import { InvitationService } from './invitation-service';
import Service, { IDEK, IKEK, IKeystoreToken, IVaultToken } from './service';

/**
 * Used for setting up delegation connections between Meeco `User`s to allow the secure management of another users account
 */
export class DelegationService extends Service<DelegationApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).DelegationApi;
  }

  public async createChildUser(
    credentials: IKEK & IVaultToken & IKeystoreToken,
    childConnectionIdentifier: string
  ): Promise<Delegation> {
    const parentKek = credentials.key_encryption_key;

    this.logger.log('Generating keys for child user');
    const childKek = SymmetricKey.generate();
    const encryptedChildKek = await parentKek.encryptKey(childKek);

    const childDek = SymmetricKey.generate();
    const encryptedChildDek = await childKek.encryptKey(childDek);

    const childToParentKeyId = 'parent_connection';
    const childToParentKey = await DecryptedKeypair.generate();
    const encryptedChildToParentKey = await childKek.encryptKey(childToParentKey.privateKey);

    const parentToChildKeyId = childConnectionIdentifier;
    const parentToChildKey = await DecryptedKeypair.generate();
    const encryptedParentToChildKey = await parentKek.encryptKey(parentToChildKey.privateKey);

    await this.keystoreAPIFactory(credentials).KeypairApi.keypairsPost({
      public_key: parentToChildKey.publicKey.pem,
      encrypted_serialized_key: encryptedParentToChildKey,
      metadata: {},
      external_identifiers: [parentToChildKeyId],
    });

    this.logger.log('Creating child user');
    const childUserResponse = await this.vaultAPIFactory(credentials).DelegationApi.childUsersPost({
      parent_public_key_for_connection: {
        pem: parentToChildKey.publicKey.pem,
        external_id: parentToChildKeyId,
      },
      child_public_key_for_connection: {
        pem: childToParentKey.publicKey.pem,
        external_id: childToParentKeyId,
      },
    });

    const childUser = childUserResponse.user;

    // check existence of delegation_token in untyped field integration_data
    const integrationData =
      childUserResponse.connection_from_parent_to_child.the_other_user.integration_data;
    if (integrationData == null) {
      throw new Error('Missing delegation token after creating child user in Vault');
    }
    const delegation_token: string = integrationData['delegation_token'];

    this.logger.log('Saving child user keys to keystore');
    return await this.keystoreAPIFactory(credentials)
      .DelegationApi.childUsersPost({
        vault_child_id: childUser.id,
        child_kek: encryptedChildKek,
        child_dek: encryptedChildDek,
        child_keypair_for_connection: {
          encrypted_private_key: encryptedChildToParentKey,
          public_key: childToParentKey.publicKey.pem,
          external_id: childToParentKeyId,
        },
        delegation_token,
      })
      .then(result => {
        return result.delegation;
      });
  }

  // Delegation connection Step 1 - Account Owner (New connection)
  public async createDelegationInvitation(
    credentials: IDEK & IKEK & IVaultToken & IKeystoreToken,
    vault_account_id: string,
    delegation_role: string,
    connectionName: string,
    keypairId?: string
  ) {
    const { delegation } = await this.keystoreAPIFactory(credentials).DelegationApi.delegationsPost(
      { vault_account_id, delegation_role }
    );

    return await new InvitationService(this.environment).create(
      credentials,
      connectionName,
      keypairId,
      {
        delegationToken: delegation.delegation_token,
        delegateRole: delegation.delegation_role,
      }
    );
  }

  // Delegation connection Step 2 - Delegate
  public async claimDelegationInvitation(
    credentials: IDEK & IKEK & IVaultToken & IKeystoreToken,
    connectionName: string,
    invitationToken: string
  ) {
    const connection = await new InvitationService(this.environment).accept(
      credentials,
      connectionName,
      invitationToken
    );

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

  // Delegation connection Step 3 - Account owner
  public async shareKekWithDelegate(
    credentials: IKEK & IVaultToken & IKeystoreToken,
    connectionId: string
  ) {
    const connection = await new ConnectionService(this.environment).get(credentials, connectionId);

    const delegationToken = this.getDelegationTokenFromConnection(connection);
    const delegatePublicKey = connection.the_other_user.user_public_key;

    const encryptedKek = await encryptWithPublicKey({
      publicKeyPem: delegatePublicKey,
      data: bytesToBinaryString(credentials.key_encryption_key.key),
    });

    await this.keystoreAPIFactory(credentials).DelegationApi.delegationsDelegationTokenSharePut(
      delegationToken,
      {
        encrypted_kek: encryptedKek.serialized,
        delegate_public_key: delegatePublicKey,
      }
    );
  }

  // Delegation connection Step 4 - Delegate
  public async reencryptSharedKek(
    credentials: IKEK & IVaultToken & IKeystoreToken,
    connectionId: string
  ) {
    const { delegation, connection } = await this.getDelegation(credentials, connectionId);
    const accountOwnerKek = await this.getAccountOwnerKek(credentials, delegation, connection);

    const reencryptedKek = await credentials.key_encryption_key.encryptKey(accountOwnerKek);

    await this.keystoreAPIFactory(credentials).DelegationApi.delegationsDelegationTokenReencryptPut(
      delegation.delegation_token,
      {
        encrypted_kek: reencryptedKek,
      }
    );
  }

  public async getAccountOwnerKek(
    credentials: IKEK & IKeystoreToken,
    delegation: Delegation,
    connection?: Connection
  ) {
    let accountOwnerKek: SymmetricKey | undefined;

    if (delegation.account_owner_kek_encrypted_with_connection_keypair) {
      if (!connection) {
        throw Error(
          'Must provide connection when account owner KEK is encrypted with the connection keypair'
        );
      }

      const { keypair } = await this.keystoreAPIFactory(credentials).KeypairApi.keypairsIdGet(
        connection.own.user_keypair_external_id!
      );

      const connectionKey = await DecryptedKeypair.fromAPI(credentials.key_encryption_key, keypair);

      accountOwnerKek = await connectionKey.privateKey.decryptKey(delegation.account_owner_kek!);
    } else {
      accountOwnerKek = await credentials.key_encryption_key.decryptKey(
        delegation.account_owner_kek!
      );
    }

    return accountOwnerKek;
  }

  private async getDelegation(credentials: IVaultToken & IKeystoreToken, connectionId: string) {
    const connection = await new ConnectionService(this.environment).get(credentials, connectionId);
    const delegationToken = this.getDelegationTokenFromConnection(connection);
    const { delegation } = await this.keystoreAPIFactory(
      credentials
    ).DelegationApi.delegationsDelegationTokenGet(delegationToken);

    return { delegation, connection };
  }

  private getDelegationTokenFromConnection(connection) {
    return (
      connection.own.integration_data?.delegation_token ||
      connection.the_other_user.integration_data?.delegation_token ||
      ''
    );
  }
}

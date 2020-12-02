import { Delegation } from '@meeco/keystore-api-sdk';
import { DelegationApi } from '@meeco/vault-api-sdk';
import { DecryptedKeypair } from '..';
import { SymmetricKey } from '../models/symmetric-key';
import Service, { IKEK, IKeystoreToken, IVaultToken } from './service';

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
    const childKek = SymmetricKey.new();
    const encryptedChildKek = await parentKek.encryptKey(childKek);

    const childDek = SymmetricKey.new();
    const encryptedChildDek = await childKek.encryptKey(childDek);

    const childToParentKeyId = 'parent_connection';
    const childToParentKey = await DecryptedKeypair.new();
    const encryptedChildToParentKey = await childKek.encryptKey(childToParentKey.privateKey);

    const parentToChildKeyId = childConnectionIdentifier;
    const parentToChildKey = await DecryptedKeypair.new();
    const encryptedParentToChildKey = await parentKek.encryptKey(parentToChildKey.privateKey);

    await this.keystoreAPIFactory(credentials).KeypairApi.keypairsPost({
      public_key: parentToChildKey.publicKey.key,
      encrypted_serialized_key: encryptedParentToChildKey,
      metadata: {},
      external_identifiers: [parentToChildKeyId],
    });

    this.logger.log('Creating child user');
    const childUser = await this.vaultAPIFactory(credentials)
      .DelegationApi.childUsersPost({
        parent_public_key_for_connection: {
          pem: parentToChildKey.publicKey.key,
          external_id: parentToChildKeyId,
        },
        child_public_key_for_connection: {
          pem: childToParentKey.publicKey.key,
          external_id: childToParentKeyId,
        },
      })
      .then(result => {
        return result.user;
      });

    this.logger.log('Saving child user keys to keystore');
    return await this.keystoreAPIFactory(credentials)
      .DelegationApi.childUsersPost({
        vault_child_id: childUser.id,
        child_kek: encryptedChildKek,
        child_dek: encryptedChildDek,
        child_keypair_for_connection: {
          encrypted_private_key: encryptedChildToParentKey,
          public_key: childToParentKey.publicKey.key,
          external_id: childToParentKeyId,
        },
      })
      .then(result => {
        return result.delegation;
      });
  }
}

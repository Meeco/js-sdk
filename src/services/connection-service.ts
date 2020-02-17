import * as cryppo from '@meeco/cryppo';
import { ConnectionApi, InvitationApi, PublicKeyApi } from '@meeco/meeco-api-sdk';
import { KeypairApi } from '@meeco/meeco-keystore-sdk';
import { AuthConfig } from '../configs/auth-config';
import { ConnectionConfig } from '../configs/connection-config';
import { IEnvironment } from '../models/environment';
import { findConnectionBetween } from '../util/ find-connection-between';

export class ConnectionService {
  constructor(private environment: IEnvironment, private log: (message: string) => void) {}

  async createConnection(config: ConnectionConfig) {
    const { to, from, options } = config;
    this.log('Generating key pairs');
    const fromKeyPair = await this.createAndStoreKeyPair(from);
    const toKeyPair = await this.createAndStoreKeyPair(to);

    this.log('Encrypting recipient names');
    const encryptedToName: string = await this.encryptRecipientName(options.toName, from);
    const encryptedFromName: string = await this.encryptRecipientName(options.fromName, to);

    this.log('Sending invitation request');
    const invitation = await new InvitationApi({
      apiKey: from.vault_access_token,
      basePath: this.environment.vault.url
    })
      .invitationsPost({
        public_key_id: fromKeyPair.vaultStoredKeyPair.id,
        encrypted_recipient_name: encryptedToName
      })
      .then(result => result.invitation);

    this.log('Accepting invitation');
    await new ConnectionApi({
      apiKey: to.vault_access_token,
      basePath: this.environment.vault.url
    })
      .connectionsPost({
        public_key_id: toKeyPair.vaultStoredKeyPair.id,
        encrypted_recipient_name: encryptedFromName,
        invitation_token: invitation.token
      })
      .then(res => res.connection);

    // Now the connection has been created we need to re-fetch the original user's connection.
    // We might as well fetch both to ensure it's connected both ways correctly.

    const { fromUserConnection, toUserConnection } = await findConnectionBetween(
      from,
      to,
      this.environment,
      this.log
    );

    return ConnectionConfig.encodeFromJson({
      invitation,
      fromUserConnection,
      toUserConnection,
      options
    });
  }

  public async listConnections(user: AuthConfig) {
    const result = await new ConnectionApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    }).connectionsGet();
    const decryptions = (result.connections || []).map(connection =>
      cryppo
        .decryptWithKey({
          serialized: connection.encrypted_recipient_name!,
          key: user.data_encryption_key.key
        })
        .then(name => ({
          name,
          connection
        }))
    );
    return Promise.all(decryptions);
  }

  private encryptRecipientName(name: string, user: AuthConfig) {
    return cryppo
      .encryptWithKey({
        data: name,
        key: user.data_encryption_key.key,
        strategy: cryppo.CipherStrategy.AES_GCM
      })
      .then(result => result.serialized);
  }

  private async createAndStoreKeyPair(user: AuthConfig) {
    const keyPair = await cryppo.generateRSAKeyPair();

    const toPrivateKeyEncrypted = await cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: user.key_encryption_key.key,
      strategy: cryppo.CipherStrategy.AES_GCM
    });

    const keystoreStoredKeyPair = await new KeypairApi({
      apiKey: user.keystore_access_token,
      basePath: this.environment.keystore.url
    })
      .keypairsPost({
        public_key: keyPair.publicKey,
        encrypted_serialized_key: toPrivateKeyEncrypted.serialized,
        // API will 500 without
        metadata: {},
        external_identifiers: []
      })
      .then(result => result.keypair);

    const vaultStoredKeyPair = await new PublicKeyApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    })
      .keyStorePublicKeysPost({
        key_store_id: keystoreStoredKeyPair.id,
        encryption_strategy: 'Rsa4096',
        public_key: keyPair.publicKey
      })
      .then(result => result.public_key);

    return {
      keyPair,
      keystoreStoredKeyPair,
      vaultStoredKeyPair
    };
  }
}

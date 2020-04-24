import * as cryppo from '@meeco/cryppo';
import { AuthConfig } from '../configs/auth-config';
import { ConnectionConfig } from '../configs/connection-config';
import { IEnvironment } from '../models/environment';
import { findConnectionBetween } from '../util/ find-connection-between';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory
} from '../util/api-factory';

export class ConnectionService {
  private vaultApiFactory: VaultAPIFactory;
  private keystoreApiFactory: KeystoreAPIFactory;
  constructor(private environment: IEnvironment, private log: (message: string) => void) {
    this.vaultApiFactory = vaultAPIFactory(environment);
    this.keystoreApiFactory = keystoreAPIFactory(environment);
  }

  async createConnection(config: ConnectionConfig) {
    const { to, from, options } = config;

    try {
      // We want to avoid creating keypairs etc. only to find out that the users were connected from the beginning
      this.log('Checking for an existing connection');
      const existingConnection = await findConnectionBetween(from, to, this.environment, this.log);
      if (existingConnection.fromUserConnection && existingConnection.toUserConnection) {
        this.log('Connection exists between the specified users');
        process.exit(1);
      }
    } catch (err) {}

    this.log('Generating key pairs');
    const fromKeyPair = await this.createAndStoreKeyPair(from);
    const toKeyPair = await this.createAndStoreKeyPair(to);

    this.log('Encrypting recipient names');
    const encryptedToName: string = await this.encryptRecipientName(options.toName, from);
    const encryptedFromName: string = await this.encryptRecipientName(options.fromName, to);

    this.log('Sending invitation request');

    const invitation = await this.vaultApiFactory(from)
      .InvitationApi.invitationsPost({
        public_key: {
          key_store_id: fromKeyPair.keystoreStoredKeyPair.id,
          public_key: fromKeyPair.keystoreStoredKeyPair.public_key,
          encryption_strategy: 'Rsa4096'
        },
        invitation: {
          encrypted_recipient_name: encryptedToName
        }
      })
      .then(result => result.invitation);

    this.log('Accepting invitation');
    await this.vaultApiFactory(to)
      .ConnectionApi.connectionsPost({
        public_key: {
          key_store_id: toKeyPair.keystoreStoredKeyPair.id,
          public_key: toKeyPair.keystoreStoredKeyPair.public_key,
          encryption_strategy: 'Rsa4096'
        },
        connection: {
          encrypted_recipient_name: encryptedFromName,
          invitation_token: invitation.token
        }
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
    const result = await this.vaultApiFactory(user).ConnectionApi.connectionsGet();
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

    const keystoreStoredKeyPair = await this.keystoreApiFactory(user)
      .KeypairApi.keypairsPost({
        public_key: keyPair.publicKey,
        encrypted_serialized_key: toPrivateKeyEncrypted.serialized,
        // API will 500 without
        metadata: {},
        external_identifiers: []
      })
      .then(result => result.keypair);

    return {
      keyPair,
      keystoreStoredKeyPair
    };
  }
}

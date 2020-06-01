import { Connection } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { ConnectionCreateData } from '../models/connection-create-data';
import { Environment } from '../models/environment';
import cryppo from '../services/cryppo-service';
import { KeystoreAPIFactory, keystoreAPIFactory, VaultAPIFactory, vaultAPIFactory } from '../util/api-factory';
import { findConnectionBetween } from '../util/find-connection-between';

export class ConnectionService {
  private cryppo = (<any>global).cryppo || cryppo;
  private vaultApiFactory: VaultAPIFactory;
  private keystoreApiFactory: KeystoreAPIFactory;
  constructor(private environment: Environment, private log: (message: string) => void) {
    this.vaultApiFactory = vaultAPIFactory(environment);
    this.keystoreApiFactory = keystoreAPIFactory(environment);
  }

  async createConnection(config: ConnectionCreateData) {
    const { to, from, options } = config;

    let existingConnection: { fromUserConnection: Connection; toUserConnection: Connection };
    try {
      // We want to avoid creating keypairs etc. only to find out that the users were connected from the beginning
      this.log('Checking for an existing connection');
      existingConnection = await findConnectionBetween(from, to, this.environment, this.log);
    } catch (err) {
      // Empty catch because getting 404's is expected if the connection does not exist
    }

    // @ts-ignore
    if (existingConnection?.fromUserConnection && existingConnection?.toUserConnection) {
      throw new Error('Connection exists between the specified users');
    }

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

    return {
      invitation,
      fromUserConnection,
      toUserConnection,
      options
    };
  }

  public async listConnections(user: AuthData) {
    const result = await this.vaultApiFactory(user).ConnectionApi.connectionsGet();
    const decryptions = (result.connections || []).map(connection =>
      this.cryppo
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

  private encryptRecipientName(name: string, user: AuthData) {
    return this.cryppo
      .encryptWithKey({
        data: name,
        key: user.data_encryption_key.key,
        strategy: this.cryppo.CipherStrategy.AES_GCM
      })
      .then(result => result.serialized);
  }

  private async createAndStoreKeyPair(user: AuthData) {
    const keyPair = await this.cryppo.generateRSAKeyPair();

    const toPrivateKeyEncrypted = await this.cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: user.key_encryption_key.key,
      strategy: this.cryppo.CipherStrategy.AES_GCM
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

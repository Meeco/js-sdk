import { Connection, ConnectionApi, ConnectionsResponse, Invitation } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { ConnectionCreateData } from '../models/connection-create-data';
import { EncryptionKey } from '../models/encryption-key';
import { findConnectionBetween } from '../util/find-connection-between';
import { getAllPaged, resultHasNext } from '../util/paged';
import Service from './service';

export interface IDecryptedConnection {
  name: string;
  connection: Connection;
}

/**
 * Used for setting up connections between Meeco `User`s to allow the secure sharing of data (see also {@link ShareService})
 */
export class ConnectionService extends Service<ConnectionApi> {
  public getAPI(vaultToken: string) {
    return this.vaultAPIFactory(vaultToken).ConnectionApi;
  }

  public async createInvitation(name: string, auth: AuthData): Promise<Invitation> {
    const keyPair = await this.createAndStoreKeyPair(
      auth.keystore_access_token,
      auth.key_encryption_key
    );

    this.logger.log('Encrypting recipient name');
    const encryptedName: string = await this.encryptName(name, auth.data_encryption_key);

    this.logger.log('Sending invitation request');
    return await this.vaultAPIFactory(auth)
      .InvitationApi.invitationsPost({
        public_key: {
          keypair_external_id: keyPair.keystoreStoredKeyPair.id,
          public_key: keyPair.keyPair.publicKey,
        },
        invitation: {
          encrypted_recipient_name: encryptedName,
        },
      })
      .then(result => result.invitation);
  }

  public async acceptInvitation(
    name: string,
    invitationToken: string,
    auth: AuthData
  ): Promise<Connection> {
    const keyPair = await this.createAndStoreKeyPair(
      auth.keystore_access_token,
      auth.key_encryption_key
    );

    this.logger.log('Encrypting connection name');
    const encryptedName: string = await this.encryptName(name, auth.data_encryption_key);

    this.logger.log('Accepting invitation');
    return await this.getAPI(auth.vault_access_token)
      .connectionsPost({
        public_key: {
          keypair_external_id: keyPair.keystoreStoredKeyPair.id,
          public_key: keyPair.keyPair.publicKey,
        },
        connection: {
          encrypted_recipient_name: encryptedName,
          invitation_token: invitationToken,
        },
      })
      .then(res => res.connection);
  }

  /**
   * Note this only works if we have authentication data for both connecting users.
   * For more typical use cases you should manually call {@link createInvitation}
   * as one user and {@link acceptInvitation} as the other user.
   */
  public async createConnection(config: ConnectionCreateData) {
    const { to, from, options } = config;

    let existingConnection: { fromUserConnection: Connection; toUserConnection: Connection };
    try {
      // We want to avoid creating keypairs etc. only to find out that the users were connected from the beginning
      this.logger.log('Checking for an existing connection');
      existingConnection = await findConnectionBetween(from, to, this.environment, this.logger.log);
    } catch (err) {
      // Empty catch because getting 404's is expected if the connection does not exist
    }

    // @ts-ignore
    if (existingConnection?.fromUserConnection && existingConnection?.toUserConnection) {
      throw new Error('Connection exists between the specified users');
    }

    const invitation = await this.createInvitation(options.toName, from);
    await this.acceptInvitation(options.fromName, invitation.token, to);

    // Now the connection has been created we need to re-fetch the original user's connection.
    // We might as well fetch both to ensure it's connected both ways correctly.

    const { fromUserConnection, toUserConnection } = await findConnectionBetween(
      from,
      to,
      this.environment,
      this.logger.log
    );

    return {
      invitation,
      fromUserConnection,
      toUserConnection,
      options,
    };
  }

  /**
   * @deprecated Use [list] instead.
   * @param user
   */
  public async listConnections(user: AuthData) {
    return this.list(user.vault_access_token, user.data_encryption_key);
  }

  public async list(
    vaultAccessToken: string,
    dek: EncryptionKey,
    nextPageAfter?: string,
    perPage?: number
  ): Promise<IDecryptedConnection[]> {
    this.logger.log('Fetching connections');
    const result = await this.getAPI(vaultAccessToken).connectionsGet(nextPageAfter, perPage);

    if (resultHasNext(result) && perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    this.logger.log('Decrypting connection names');
    const decryptions = (result.connections || []).map(connection =>
      connection.own.encrypted_recipient_name
        ? Service.cryppo
            .decryptWithKey({
              serialized: connection.own.encrypted_recipient_name!,
              key: dek.key,
            })
            .then((name: string) => ({
              recipient_name: name,
              connection,
            }))
        : {
            recipient_name: null,
            connection,
          }
    );
    return Promise.all(decryptions);
  }

  public async listAll(
    vaultAccessToken: string,
    dek: EncryptionKey
  ): Promise<IDecryptedConnection[]> {
    const api = this.getAPI(vaultAccessToken);

    return getAllPaged(cursor => api.connectionsGet(cursor)).then(results => {
      const responses = results.reduce(
        (a: Connection[], b: ConnectionsResponse) => a.concat(b.connections),
        []
      );
      const decryptions = responses.map(connection =>
        connection.own.encrypted_recipient_name
          ? Service.cryppo
              .decryptWithKey({
                serialized: connection.own.encrypted_recipient_name!,
                key: dek.key,
              })
              .then((name: string) => ({
                recipient_name: name,
                connection,
              }))
          : {
              recipient_name: null,
              connection,
            }
      );
      return Promise.all(decryptions);
    });
  }

  private encryptName(name: string, dek: EncryptionKey) {
    return Service.cryppo
      .encryptWithKey({
        data: name,
        key: dek.key,
        strategy: Service.cryppo.CipherStrategy.AES_GCM,
      })
      .then(result => result.serialized);
  }

  private async createAndStoreKeyPair(keystoreToken: string, keyEncryptionKey: EncryptionKey) {
    this.logger.log('Generating key pair');
    const keyPair = await Service.cryppo.generateRSAKeyPair();

    const toPrivateKeyEncrypted = await Service.cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: keyEncryptionKey.key,
      strategy: Service.cryppo.CipherStrategy.AES_GCM,
    });

    const keystoreStoredKeyPair = await this.keystoreAPIFactory(keystoreToken)
      .KeypairApi.keypairsPost({
        public_key: keyPair.publicKey,
        encrypted_serialized_key: toPrivateKeyEncrypted.serialized,
        // API will 500 without
        metadata: {},
        external_identifiers: [],
      })
      .then(result => result.keypair);

    return {
      keyPair,
      keystoreStoredKeyPair,
    };
  }
}

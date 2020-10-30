import { Connection, ConnectionApi, ConnectionsResponse } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { getAllPaged, resultHasNext } from '../util/paged';
import { InvitationService } from './invitation-service';
import Service, { IDEK, IPageOptions, IVaultToken } from './service';

export interface IDecryptedConnection {
  recipient_name: string | null;
  connection: Connection;
}

export interface IConnectionMetadata {
  toName: string;
  fromName: string;
}

// tslint:disable-next-line:interface-name
export interface ConnectionCreateData {
  from: AuthData;
  to: AuthData;
  options: IConnectionMetadata;
}

/**
 * Used for setting up connections between Meeco `User`s to allow the secure sharing of data (see also {@link ShareService})
 */
export class ConnectionService extends Service<ConnectionApi> {
  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token.vault_access_token).ConnectionApi;
  }

  /**
   * Note this only works if we have authentication data for both connecting users.
   * For more typical use cases you should manually call {@link InvitationService.create}
   * as one user and {@link InvitationService.accept} as the other user.
   */
  public async createConnection(config: ConnectionCreateData) {
    const { to, from, options } = config;

    let existingConnection: {
      fromUserConnection: Connection;
      toUserConnection: Connection;
    };
    try {
      // We want to avoid creating keypairs etc. only to find out that the users were connected from the beginning
      this.logger.log('Checking for an existing connection');
      existingConnection = await this.findConnectionBetween(from, to);
    } catch (err) {
      // Empty catch because getting 404's is expected if the connection does not exist
    }

    // @ts-ignore
    if (existingConnection?.fromUserConnection && existingConnection?.toUserConnection) {
      throw new Error('Connection exists between the specified users');
    }

    const invitations = new InvitationService(this.environment);

    const invitation = await invitations.create(from, options.toName);
    await invitations.accept(to, options.fromName, invitation.token);

    // Now the connection has been created we need to re-fetch the original user's connection.
    // We might as well fetch both to ensure it's connected both ways correctly.

    const { fromUserConnection, toUserConnection } = await this.findConnectionBetween(from, to);

    return {
      invitation,
      fromUserConnection,
      toUserConnection,
      options,
    };
  }

  /**
   * @deprecated Use {@link list} instead.
   * @param user
   */
  public async listConnections(credentials: IVaultToken & IDEK) {
    return this.list(credentials);
  }

  public async list(
    credentials: IVaultToken & IDEK,
    options?: IPageOptions
  ): Promise<IDecryptedConnection[]> {
    const { vault_access_token, data_encryption_key } = credentials;

    this.logger.log('Fetching connections');
    const result = await this.vaultAPIFactory(vault_access_token).ConnectionApi.connectionsGet(
      options?.nextPageAfter,
      options?.perPage
    );

    if (resultHasNext(result) && options?.perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    this.logger.log('Decrypting connection names');
    const decryptions = (result.connections || []).map(connection =>
      connection.own.encrypted_recipient_name
        ? Service.cryppo
            .decryptWithKey({
              serialized: connection.own.encrypted_recipient_name!,
              key: data_encryption_key.key,
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

  public async listAll(credentials: IVaultToken & IDEK): Promise<IDecryptedConnection[]> {
    const { vault_access_token, data_encryption_key } = credentials;
    const api = this.vaultAPIFactory(vault_access_token).ConnectionApi;

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
                key: data_encryption_key.key,
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
  /**
   * @deprecated Use `get` instead.
   */
  public async fetchConnectionWithId(
    credentials: IVaultToken,
    connectionId: string
  ): Promise<Connection> {
    return this.get(credentials, connectionId);
  }

  public async get(credentials: IVaultToken, connectionId: string): Promise<Connection> {
    this.logger.log('Fetching user connection');
    const response = await this.vaultAPIFactory(
      credentials.vault_access_token
    ).ConnectionApi.connectionsIdGet(connectionId);
    const connection = response.connection;

    if (!connection || !connection.own.id) {
      throw new Error(`Connection ${connectionId} not found.`);
    }

    return connection;
  }

  /**
   * Helper to find connection between two users (if one exists)
   * Throws an Error if no connection exists.
   */
  public async findConnectionBetween(fromUser: IVaultToken, toUser: IVaultToken) {
    this.logger.log('Fetching from user connections');
    const { connections: fromUserConnections } = await this.vaultAPIFactory(
      fromUser.vault_access_token
    ).ConnectionApi.connectionsGet();

    if (fromUserConnections.length === 0) {
      throw new Error('Users are not connected. Please set up a connection first.');
    }

    this.logger.log('Fetching to user connections');
    const { connections: toUserConnections } = await this.vaultAPIFactory(
      toUser.vault_access_token
    ).ConnectionApi.connectionsGet();

    let toUserConnection: Connection | undefined;

    const fromUserConnection = fromUserConnections.find(fromConnection => {
      const result = toUserConnections.find(
        toConnection =>
          fromConnection.own.user_public_key === toConnection.the_other_user.user_public_key
      );
      if (result) {
        toUserConnection = result;
      }
      return !!result;
    });

    if (!fromUserConnection) {
      throw new Error('Users are not connected. Please set up a connection first.');
    }

    // toUserConnection must be defined if fromUserConnection is
    return { fromUserConnection, toUserConnection: toUserConnection! };
  }
}

import {
  CollectionReport,
  Connection,
  ConnectionApi,
  ConnectionsResponse,
} from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { SymmetricKey } from '../models/symmetric-key';
import { getAllPaged, resultHasNext } from '../util/paged';
import { InvitationService } from './invitation-service';
import Service, { IDEK, IPageOptions, IVaultToken } from './service';

export interface IDecryptedConnection {
  recipient_name: string | null;
  connection: Connection;
}

export interface IDecryptedConnectionsResponse {
  connections: IDecryptedConnection[];
  meta: CollectionReport;
  next_page_after: string | null;
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
    return this.vaultAPIFactory(token).ConnectionApi;
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
   * Used for deleting a connection between two vaults.
   * Throws an error if connection does not exist.
   */
  public async deleteConnection(credentials: IVaultToken, id: string) {
    await this.vaultAPIFactory(credentials).ConnectionApi.connectionsIdDelete(id);
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
  ): Promise<IDecryptedConnectionsResponse> {
    const { data_encryption_key } = credentials;

    this.logger.log('Fetching connections');
    const result = await this.vaultAPIFactory(credentials).ConnectionApi.connectionsGet(
      options?.nextPageAfter,
      options?.perPage
    );

    if (resultHasNext(result) && options?.perPage === undefined) {
      this.logger.warn('Some results omitted, but page limit was not explicitly set');
    }

    this.logger.log('Decrypting connection names');
    const decryptConnections = Promise.all(
      (result.connections || []).map(this.decryptConnection(data_encryption_key))
    );
    const decryptConnectionsResponse: IDecryptedConnectionsResponse = {
      connections: await decryptConnections,
      meta: result.meta,
      next_page_after: result.next_page_after,
    };
    return decryptConnectionsResponse;
  }

  public async listAll(credentials: IVaultToken & IDEK): Promise<IDecryptedConnection[]> {
    const { data_encryption_key } = credentials;
    const api = this.vaultAPIFactory(credentials).ConnectionApi;

    return getAllPaged(cursor => api.connectionsGet(cursor)).then(results => {
      const responses = results.reduce(
        (a: Connection[], b: ConnectionsResponse) => a.concat(b.connections),
        []
      );
      return Promise.all((responses || []).map(this.decryptConnection(data_encryption_key)));
    });
  }

  private decryptConnection(dek: SymmetricKey) {
    return async (connection: Connection) => {
      const encryptedName = connection.own.encrypted_recipient_name;
      return {
        recipient_name: encryptedName ? await dek.decryptString(encryptedName) : encryptedName,
        connection,
      };
    };
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
    const response = await this.vaultAPIFactory(credentials).ConnectionApi.connectionsIdGet(
      connectionId
    );
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
      fromUser
    ).ConnectionApi.connectionsGet();

    if (fromUserConnections.length === 0) {
      throw new Error('Users are not connected. Please set up a connection first.');
    }

    this.logger.log('Fetching to user connections');
    const { connections: toUserConnections } = await this.vaultAPIFactory(
      toUser
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

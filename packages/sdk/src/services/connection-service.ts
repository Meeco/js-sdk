import { Connection, ConnectionApi, ConnectionsResponse } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { ConnectionCreateData } from '../models/connection-create-data';
import { EncryptionKey } from '../models/encryption-key';
import { findConnectionBetween } from '../util/find-connection-between';
import { getAllPaged, resultHasNext } from '../util/paged';
import { InvitationService } from './invitation-service';
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

  /**
   * Note this only works if we have authentication data for both connecting users.
   * For more typical use cases you should manually call {@link InvitationService.create}
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

    const invitations = new InvitationService(this.environment);

    const invitation = await invitations.create(options.toName, from);
    await invitations.accept(options.fromName, invitation.token, to);

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
   * @deprecated Use {@link list} instead.
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
}

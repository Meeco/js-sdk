import { AuthData } from '../models/auth-data';
import { Environment } from '../models/environment';
import { vaultAPIFactory } from './api-factory';

function connectionApi(user: AuthData, environment: Environment) {
  return vaultAPIFactory(environment)(user).ConnectionApi;
}

export async function findConnectionBetween(
  fromUser: AuthData,
  toUser: AuthData,
  environment: Environment,
  log: (message: string) => void
) {
  log('Fetching from user connections');
  const fromUserConnections = await connectionApi(fromUser, environment).connectionsGet();
  log('Fetching to user connections');
  const toUserConnections = await connectionApi(toUser, environment).connectionsGet();

  const sharedConnections = fromUserConnections.connections!.filter(
    fromConnection =>
      !!toUserConnections.connections!.find(
        toConnection => fromConnection.public_key === toConnection.other_user_connection_public_key
      )
  );

  if (sharedConnections.length < 1) {
    throw new Error('Users are not connected. Please set up a connection first.');
  }
  const [fromUserConnection] = sharedConnections;
  const toUserConnection = toUserConnections.connections!.find(
    toConnection => fromUserConnection.public_key === toConnection.other_user_connection_public_key
  );

  if (!toUserConnection) {
    throw new Error('To user connection not found. Invitation may not have been accepted');
  }

  return { fromUserConnection, toUserConnection };
}

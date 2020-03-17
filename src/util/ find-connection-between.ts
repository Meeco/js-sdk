import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../configs/auth-config';
import { IEnvironment } from '../models/environment';
import { vaultAPIFactory } from './api-factory';

function connectionApi(user: AuthConfig, environment: IEnvironment) {
  return vaultAPIFactory(environment)(user).ConnectionApi;
}

export async function findConnectionBetween(
  fromUser: AuthConfig,
  toUser: AuthConfig,
  environment: IEnvironment,
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
    throw new CLIError('Users are not connected. Please set up a connection first.');
  }
  const [fromUserConnection] = sharedConnections;
  const toUserConnection = toUserConnections.connections!.find(
    toConnection => fromUserConnection.public_key === toConnection.other_user_connection_public_key
  );

  if (!toUserConnection) {
    throw new CLIError('To user connection not found. Invitation may not have been accepted');
  }

  return { fromUserConnection, toUserConnection };
}

import { AuthData } from '../models/auth-data';
import { Environment } from '../models/environment';
import { ConnectionService } from '../services/connection-service';

/**
 * Helper to find connection between two users (if one exists)
 * @deprecated Use {@link ConnectionService.findConnectionBetween}
 */
export async function findConnectionBetween(
  fromUser: AuthData,
  toUser: AuthData,
  environment: Environment,
  log: (message: string) => void
) {
  return new ConnectionService(environment, log).findConnectionBetween(fromUser, toUser);
}

/** @deprecated Use {@link ConnectionService.get} */
export async function fetchConnectionWithId(
  user: AuthData,
  connectionId: string,
  environment: Environment,
  log: (message: string) => void
) {
  return new ConnectionService(environment, log).get(user, connectionId);
}

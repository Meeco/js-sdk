// tslint:disable-next-line: no-var-requires
const baseX = require('base-x');
import { Buffer as _buffer } from 'buffer';
import { ERROR_CODES, MeecoServiceError } from '../models/service-error';
import cryppo from '../services/cryppo-service';

/**
 * Used for dealing with Meeco secrets - used for user authentication and login
 */
export default class Secrets {
  private static readonly derivationConstants = {
    iterationVariance: 0,
    minIterations: 100000,
    length: 32,
  };

  /**
   * Pluck the SRP Username from a users' secret
   */
  public static usernameFromSecret(secret: string): string {
    const { username } = Secrets.destructureSecret(secret);
    return username;
  }

  /**
   * Given a user's Secret and Passphrase - derive the Passphrase Derived Key (used to decrypt their Key Encryption Key)
   */
  public static async derivePDKFromSecret(
    userEnteredPassword: string,
    secret: string
  ): Promise<string> {
    const { secretKey } = Secrets.destructureSecret(secret);
    return Secrets.derivePDK(userEnteredPassword, secretKey);
  }

  public static async srpPasswordFromSecret(
    userEnteredPassword: string,
    secret: string
  ): Promise<string> {
    const { secretKey } = Secrets.destructureSecret(secret);
    return Secrets.deriveSRPPasswordFromSecretKey(userEnteredPassword, secretKey);
  }

  /**
   * Generate a new user Secret from the provided username.
   * Usernames can be requested via the {@link UserService}
   */
  public static generateSecret(username: string): string {
    const key = cryppo.generateRandomKey(32);
    const secretKey = Secrets.encodeBase58(key);
    const version = 1;
    const readable = secretKey.match(/(.{1,6})/g)!.join('-');
    return `${version}.${username}.${readable}`;
  }

  /**
   * Public for testing purposes only.
   *
   * @ignore
   */
  public static encodeBase58(val: string | Buffer) {
    // https://tools.ietf.org/html/draft-msporny-base58-01
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const input = val instanceof Buffer ? val : _buffer.from(val, 'binary');
    return baseX(ALPHABET).encode(input);
  }

  /**
   * Separate out a user's secret into its component parts
   */
  private static destructureSecret(secret: string) {
    const [version, username, secretKey] = secret.split('.');
    if (!version || !username || !secretKey) {
      throw new MeecoServiceError('Invalid secret format', ERROR_CODES.InvalidSecretFormat);
    }
    return {
      version,
      username,
      secretKey: secretKey.replace(/-/g, ''), // strip padding from secret key
    };
  }

  private static async deriveSRPPasswordFromSecretKey(password: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }

    const salt = secretKey
      .split('')
      .reverse()
      .join('');

    const { key } = await cryppo.generateDerivedKey({
      ...this.derivationConstants,
      key: password,
      useSalt: salt,
    });

    return key;
  }

  private static async derivePDK(password: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }

    const { key } = await cryppo.generateDerivedKey({
      ...this.derivationConstants,
      key: password,
      useSalt: secretKey,
    });

    return key;
  }
}

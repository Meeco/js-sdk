// tslint:disable-next-line: no-var-requires
const baseX = require('base-x');
import { ERROR_CODES, MeecoServiceError } from '../models/service-error';
import cryppo from './cryppo-service';

/**
 * Used for dealing with Meeco secrets - used for user authentication and login
 */
export class SecretService {
  private readonly derivationConstants = {
    iterationVariance: 0,
    minIterations: 100000,
    length: 32
  };

  /**
   * Pluck the SRP Username from a users' secret
   */
  public usernameFromSecret(secret: string) {
    const { username } = this.destructureSecret(secret);
    return username;
  }

  /**
   * Given a user's Secret and Passphrase - derive the Passphrase Derived Key (used to decrypt their Key Encryption Key)
   */
  public derivePDKFromSecret(userEnteredPassword: string, secret: string) {
    const { secretKey } = this.destructureSecret(secret);
    return this.derivePDK(userEnteredPassword, secretKey);
  }

  public srpPasswordFromSecret(userEnteredPassword: string, secret: string) {
    const { secretKey } = this.destructureSecret(secret);
    return this.deriveSRPPasswordFromSecretKey(userEnteredPassword, secretKey);
  }

  /**
   * Generate a new user Secret from the provided username.
   * Usernames can be requested via the {@link UserService}
   */
  public async generateSecret(username: string) {
    const key = await cryppo.generateRandomKey(32);
    const secretKey = this.encodeBase58(key);
    const version = 1;
    const readable = secretKey.match(/(.{1,6})/g)!.join('-');
    return `${version}.${username}.${readable}`;
  }

  /**
   * Public for testing purposes only.
   *
   * @ignore
   */
  public encodeBase58(val: string | Buffer) {
    // https://tools.ietf.org/html/draft-msporny-base58-01
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const input = val instanceof Buffer ? val : Buffer.from(val, 'binary');
    return baseX(ALPHABET).encode(input);
  }

  /**
   * Separate out a user's secret into its component parts
   */
  private destructureSecret(secret: string) {
    const [version, username, secretKey] = secret.split('.');
    if (!version || !username || !secretKey) {
      throw new MeecoServiceError('Invalid secret format', ERROR_CODES.InvalidSecretFormat);
    }
    return {
      version,
      username,
      secretKey: secretKey.replace(/-/g, '') // strip padding from secret key
    };
  }

  private deriveSRPPasswordFromSecretKey(password: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }
    return cryppo
      .generateDerivedKey({
        ...this.derivationConstants,
        key: password,
        useSalt: secretKey
          .split('')
          .reverse()
          .join('')
      })
      .then(derived => derived.key);
  }

  private derivePDK(password: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }
    return cryppo
      .generateDerivedKey({
        ...this.derivationConstants,
        key: password,
        useSalt: secretKey
      })
      .then(derived => derived.key);
  }
}

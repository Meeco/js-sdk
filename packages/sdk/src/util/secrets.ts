import { binaryStringToBytes, bytesToBinaryString } from '@meeco/cryppo';
import b58 from 'bs58';
import { ERROR_CODES, MeecoServiceError } from '../models/service-error';
import { SymmetricKey } from '../models/symmetric-key';
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
  ): Promise<SymmetricKey> {
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
    const key = binaryStringToBytes(cryppo.generateRandomBytesString(32));
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
  public static encodeBase58(val: Uint8Array) {
    return b58.encode(val);
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

  private static async deriveSRPPasswordFromSecretKey(passphrase: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }

    const salt = secretKey.split('').reverse().join('');

    const { key } = await cryppo.generateDerivedKey({
      ...this.derivationConstants,
      passphrase,
      useSalt: salt,
    });

    return bytesToBinaryString(key.bytes);
  }

  private static async derivePDK(passphrase: string, secretKey: string): Promise<SymmetricKey> {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }

    const { key } = await cryppo.generateDerivedKey({
      ...this.derivationConstants,
      passphrase,
      useSalt: secretKey,
    });

    return SymmetricKey.fromCryppoKey(key);
  }
}

import { generateDerivedKey, generateRandomKey } from '@meeco/cryppo';
import * as baseX from 'base-x';
export class SecretService {
  private readonly derivationConstants = {
    iterationVariance: 0,
    minIterations: 100000,
    length: 32
  };

  public usernameFromSecret(secret: string) {
    const { username } = this.destructureSecret(secret);
    return username;
  }

  public derivePDKFromSecret(userEnteredPassword: string, secret: string) {
    const { secretKey } = this.destructureSecret(secret);
    return this.derivePDK(userEnteredPassword, secretKey);
  }

  public srpPasswordFromSecret(userEnteredPassword: string, secret: string) {
    const { secretKey } = this.destructureSecret(secret);
    return this.deriveSRPPasswordFromSecretKey(userEnteredPassword, secretKey);
  }

  public async generateSecret() {
    const key = await generateRandomKey(32);
    // TODO: Should come from the server
    const mockUsername = await generateRandomKey(8);
    const userName = this.encodeBase58(mockUsername);
    const secretKey = this.encodeBase58(key);
    const version = 1;
    const readable = secretKey.match(/(.{1,6})/g)!.join('-');
    return `${version}.${userName}.${readable}`;
  }

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
    return generateDerivedKey({
      ...this.derivationConstants,
      key: password,
      useSalt: secretKey
        .split('')
        .reverse()
        .join('')
    }).then(derived => derived.key);
  }

  private derivePDK(password: string, secretKey: string) {
    if (secretKey.indexOf('.') >= 0) {
      throw new Error('Incorrect secret provided. Please destructure the secret_key.');
    }
    return generateDerivedKey({
      ...this.derivationConstants,
      key: password,
      useSalt: secretKey
    }).then(derived => derived.key);
  }
}

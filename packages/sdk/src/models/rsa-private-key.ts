import cryppo from '../services/cryppo-service';
import { ASYMMETRIC_KEY_STRATEGY } from './rsa-public-key';
import { SymmetricKey } from './symmetric-key';

/**
 * PEM formatted private key, e.g. '-----BEGIN RSA PRIVATE KEY--- base64 encoded key...'.
 * Unlike {@link SymmetricKey} it is never written in raw bytes.
 * The constructor will check the format of the key string.
 */
export default class RSAPrivateKey {
  constructor(private readonly _value: string) {
    if (!_value.startsWith('-----BEGIN RSA PRIVATE KEY')) {
      throw new Error('Not an RSA private key: ' + _value);
    }
  }

  /** PEM formatted key string */
  get key() {
    return this._value;
  }

  /**
   * Used for base64 encoded access tokens.
   * @param serialized
   */
  async decryptToken(serialized: string) {
    return cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: this.key,
      serialized,
      scheme: ASYMMETRIC_KEY_STRATEGY,
    });
  }

  async decryptKey(serialized: string): Promise<SymmetricKey> {
    return this.decryptToken(serialized).then(result => SymmetricKey.fromRaw(result!));
  }
}

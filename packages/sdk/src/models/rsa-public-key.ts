import { bytesToBinaryString } from '@meeco/cryppo';
import cryppo from '../services/cryppo-service';
import { SymmetricKey } from './symmetric-key';

export const ASYMMETRIC_KEY_STRATEGY = 'RSA-OAEP';

/**
 * PEM formatted public key, e.g. '-----BEGIN PUBLIC KEY--- base64 encoded key...'.
 * Unlike {@link SymmetricKey} it is never written in raw bytes.
 */
export default class RSAPublicKey {
  constructor(private readonly _value: string) {
    if (!_value.startsWith('-----BEGIN PUBLIC KEY')) {
      throw new Error('Not an RSA public key: ' + _value);
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
  async encryptToken(value: string): Promise<string> {
    return cryppo
      .encryptWithPublicKey({
        publicKeyPem: this.key,
        data: value,
        scheme: ASYMMETRIC_KEY_STRATEGY,
      })
      .then(r => r.serialized);
  }

  async encryptKey(key: SymmetricKey): Promise<string> {
    return this.encryptToken(bytesToBinaryString(key.key));
  }
}

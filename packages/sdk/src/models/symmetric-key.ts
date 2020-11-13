import cryppo from '../services/cryppo-service';

export const SYMMETRIC_KEY_LENGTH = 32;

/**
 * An key that can be used to encrypt and decrypt data travelling to and from Meeco's services.
 * This wrapper ensures that keys can be safely serialized as JSON (by encoding them as URL-Safe Base64)
 * and avoids confusion when dealing with converting to and from this encoded format.
 */
export class SymmetricKey {
  /**
   * The constructor is intentionally private as we want the user ot be explicit as to whether the value coming
   * in is raw bytes or a base64 encoded version.
   *
   * @param _value  Value as binary string. Avoid outputting to console but should be used for actual encryption.
   */
  private constructor(private readonly _value: string) {
    if (!_value) {
      throw new Error('Empty encryption key!');
    }
  }

  static new(): SymmetricKey {
    return SymmetricKey.fromRaw(cryppo.generateRandomKey(SYMMETRIC_KEY_LENGTH));
  }

  /**
   * Create a {@link SymmetricKey} from encoded URL-safe base 64 version of the key
   */
  static fromSerialized(value: string) {
    const parseResult = cryppo.decodeSafe64(value || '');
    if (parseResult.length !== SYMMETRIC_KEY_LENGTH) {
      throw new Error(`Deserialized key length did not equal ${SYMMETRIC_KEY_LENGTH}`);
    }
    return new SymmetricKey(parseResult);
  }

  /**
   * Create an {@link SymmetricKey} from a binary string version of the key
   */
  static fromRaw(value: string) {
    if (value.length !== SYMMETRIC_KEY_LENGTH) {
      throw new Error(`Key length did not equal ${SYMMETRIC_KEY_LENGTH}`);
    }
    return new SymmetricKey(value);
  }

  /**
   * Return the actual encryption key to be used for encryption/decryption
   */
  get key() {
    return this._value;
  }

  /**
   * Implicitly called by `JSON.stringify()` to ensure that the value is safely printable
   */
  toJSON() {
    return cryppo.encodeSafe64(this._value);
  }
}

import * as Cryppo from '@meeco/cryppo';
/**
 * An key that can be used to encrypt and decrypt data travelling to and from Meeco's services.
 * This wrapper ensures that keys can be safely serialized as JSON (by encoding them as URL-Safe Base64)
 * and avoids confusion when dealing with converting to and from this encoded format.
 */
export class EncryptionKey {
  /**
   * The constructor is intentionally private as we want the user ot be explicit as to whether the value coming
   * in is raw bytes or a base64 encoded version.
   *
   * @param _value  Value as binary string. Avoid outputting to console but should be used for actual encryption.
   */
  private constructor(private readonly _value: string) {}

  /**
   * Create an {@link EncryptionKey} from encoded URL-safe base 64 version of the key
   */
  static fromSerialized(value: string) {
    return new EncryptionKey(Cryppo.decodeSafe64(value || ''));
  }

  /**
   * Create an {@link EncryptionKey} from a binary string version of the key
   */
  static fromRaw(value: string) {
    return new EncryptionKey(value);
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
  toJSON(key) {
    return Cryppo.encodeSafe64(this._value);
  }
}

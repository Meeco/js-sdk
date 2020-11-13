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

  /**
   * Used to encrypt user-entered data such as birthdays or name.
   * Should *not* be used to encrypt keys - use [encryptKey] instead.
   * Encryption keys are considered binary data even though they are often represented as strings
   */
  async encryptString(value: string): Promise<string | null> {
    if (value === null || value === '') {
      return null;
    }
    return cryppo
      .encryptStringWithKey({
        data: value,
        key: this.key,
        strategy: cryppo.CipherStrategy.AES_GCM,
      })
      .then(result => result.serialized);
  }

  /**
   * Used to encrypt generated bytes such as encryption keys or verification keys.
   * N.B.. Encryption keys are considered binary data even though they are often represented as strings
   */
  async encryptKey(key: SymmetricKey): Promise<string> {
    return cryppo
      .encryptBinaryWithKey({
        data: key.key,
        key: this.key,
        strategy: cryppo.CipherStrategy.AES_GCM,
      })
      .then(result => result.serialized!);
  }

  /**
   * Used to decrypt user-entered data such as birthdays or name.
   * Should *not* be used to decrypt keys - use [decryptKey] instead.
   * Encryption keys are considered binary data even though they are often represented as strings
   */
  async decryptString(serialized: string): Promise<string | null> {
    return cryppo.decryptStringWithKey({
      key: this.key,
      serialized,
    });
  }

  /**
   * Used to decrypt generated bytes such as encryption keys or verification keys.
   * N.B.. Encryption keys are considered binary data even though they are often represented as strings
   */
  async decryptKey(serialized: string) {
    if (serialized === null) {
      return null;
    }
    return cryppo
      .decryptBinaryWithKey({
        key: this.key,
        serialized,
      })
      .then(result => SymmetricKey.fromRaw(result!));
  }
}

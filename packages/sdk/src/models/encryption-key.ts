import cryppo from '../services/cryppo-service';

export class EncryptionKey {
  // Value as binary string. Avoid outputting to console but should be used for actual encryption.

  private constructor(private readonly _value: string) {}

  /**
   * Encryption key from encoded base 64 version of the key
   */
  static fromSerialized(value: string) {
    return new EncryptionKey(cryppo.decodeSafe64(value || ''));
  }

  /**
   * Encryption key from a binary string version of the key
   */
  static fromRaw(value: string) {
    return new EncryptionKey(value);
  }

  get key() {
    return this._value;
  }

  toJSON(key) {
    return cryppo.encodeSafe64(this._value);
  }
}

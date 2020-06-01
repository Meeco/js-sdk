import { Slot } from '@meeco/vault-api-sdk';

// Because the Meeco Vault API `Slot` no longer has `value` - `DecryptedSlot` represents a slot with a decrypted `encrypted_value`.
export type DecryptedSlot = Slot & {
  /**
   * The decrypted slot value
   */
  value?: any;
};

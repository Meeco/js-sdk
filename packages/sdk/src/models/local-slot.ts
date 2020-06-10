import { Slot } from '@meeco/vault-api-sdk';

/**
 * For all intents and purposes - this is a `Slot` from `@meeco/vault-api-sdk`.
 *
 * Mostly because the Meeco Vault API `Slot` no longer has `value` - `DecryptedSlot` represents a slot with a decrypted `encrypted_value`.
 */
export type DecryptedSlot = Slot & {
  /**
   * The decrypted slot value
   */
  value?: any;
};

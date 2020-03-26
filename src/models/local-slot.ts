import { Slot } from '@meeco/vault-api-sdk';

// Because the Meeco Vault API no longer has slot - slot represents the decrypted value.
export type LocalSlot = Slot & {
  /**
   * The decrypted slot value
   */
  value?: any;
};

import { NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import parameterize from 'parameterize';

/**
 * For all intents and purposes - this is a `Slot` from `@meeco/vault-api-sdk`.
 *
 * Mostly because the Meeco Vault API `Slot` no longer has `value` - `DecryptedSlot` represents a slot with a decrypted `encrypted_value`.
 */
export type DecryptedSlot = Omit<NestedSlotAttributes, 'encrypted_value'>;

export interface IDecryptedSlot extends Slot {
  value_verification_key?: string;
  value?: string;
}

export enum SlotType {
  Bool = 'bool',
  ClassificationNode = 'classification_node',
  Color = 'color',
  Date = 'date',
  DateTime = 'datetime',
  Image = 'image',
  KeyValue = 'key_value',
  NoteText = 'note_text',
  Select = 'select',
  Attachment = 'attachment',
  URL = 'url',
  PhoneNumber = 'phone_number',
  SelectMultiple = 'select_multiple',
  Email = 'email',
  Password = 'password',
}

/** Every Slot must have either a non-empty name or label */
export type MinimalSlot = { name: string, label?: string } | { name?: string, label: string };

export type SlotAttributes = Omit<NestedSlotAttributes, 'name' | 'label'>;

export type NewSlot = MinimalSlot & SlotAttributes;

export function anyDuplicateSlotNames(slots: Array<{ name?: string }>): boolean {
  const namesSeen = {};

  for (const s of slots) {
    if (s.name) {
      if (namesSeen[s.name]) {
        return true;
      }
      namesSeen[s.name] = s.name;
    }
  }
  return false;
}

export function findWithEncryptedValue<T>(slots: T[]): T | undefined {
  return slots.find(s => s['encrypted_value'] != null);
}

/** Convert Slot names to labels as per the backend */
export function nameFromLabel(label: string): string {
  return parameterize(label, undefined, '_');
}

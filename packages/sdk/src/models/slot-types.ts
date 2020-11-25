import { NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import { SymmetricKey } from './symmetric-key';

/**
 * After decryption all `encrypted_X` props are replaced with `X` props.
 * In particular `encrypted_value` becomes `value`.
 */
export type SDKDecryptedSlot = Omit<
  Slot,
  'encrypted_value' | 'encrypted_value_verification_key'
> & {
  value: string | null;
  value_verification_key: SymmetricKey | null;
};

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
export type MinimalSlot = { name: string; label?: string } | { name?: string; label: string };

/** Optional attributes which can be specified when creating a new Slot */
export type SlotAttributes = Omit<NestedSlotAttributes, 'name' | 'label'>;

export type NewSlot = MinimalSlot & SlotAttributes;

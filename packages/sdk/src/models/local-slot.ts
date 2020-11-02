import { NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import parameterize from 'parameterize';

/**
 * After decryption all `encrypted_X` props are replaced with `X` props.
 * In particular `encrypted_value` becomes `value`.
 */
export type SDKDecryptedSlot = Omit<
  Slot,
  'encrypted_value' | 'encrypted_value_verification_key'
> & {
  value: string | null;
  value_verification_key: string | null;
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

/**
 * Represent an Item as a map from Slot.names to Slots.
 * @param item
 */
export function toNameSlotMap<S extends MinimalSlot, T extends { slots: S[] }>(
  item: T
): Record<string, S> {
  function getSlotName(slot: S): string {
    return slot.name || nameFromLabel(slot.label!);
  }

  const map: Record<string, S> = {};

  item.slots.forEach(slot => {
    map[getSlotName(slot)] = slot;
  });

  return map;
}

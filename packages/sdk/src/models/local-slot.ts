import { EncryptedSlotValue, NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import parameterize from 'parameterize';
import { ItemService } from '../services/item-service';
import { IDEK } from '../services/service';

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

/**
 * Convert Slot names to labels as per the backend URL-safe encoding.
 * For example `A Slot/name?` becomes `a_slot_name`.
 */
export function nameFromLabel(label: string): string {
  return parameterize(label, undefined, '_');
}

export async function toEncryptedSlotValue(
  credentials: IDEK,
  slot: SDKDecryptedSlot
): Promise<EncryptedSlotValue> {
  const withHash = await ItemService.addVerificationHash(slot, credentials.data_encryption_key);

  const {
    id,
    encrypted_value,
    encrypted_value_verification_key,
    value_verification_hash,
  } = await ItemService.encryptSlot(credentials, withHash);

  // TODO due to an API bug, this doesn't typecheck when encrypted_value is undefined
  return {
    slot_id: id,
    encrypted_value,
    encrypted_value_verification_key,
    value_verification_hash,
  } as EncryptedSlotValue;
}

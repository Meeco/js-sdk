import { EncryptedSlotValue, NestedSlotAttributes, Slot } from '@meeco/vault-api-sdk';
import parameterize from 'parameterize';
import cryppo from '../services/cryppo-service';
import { IDEK } from '../services/service';
import {
  VALUE_VERIFICATION_KEY_LENGTH,
  valueVerificationHash,
  verifyHashedValue,
} from '../util/value-verification';
import { EncryptionKey } from './encryption-key';

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

export class SlotHelpers {
  /** @ignore */
  private static readonly cryppo = (<any>global).cryppo || cryppo;

  // for mocking during testing
  private static valueVerificationHash =
    (<any>global).valueVerificationHash || valueVerificationHash;

  /**
   * Updates 'value' to the decrypted 'encrypted_value' and sets 'encrypted' to false.
   */
  static async decryptSlot(credentials: IDEK, slot: Slot): Promise<SDKDecryptedSlot> {
    const { data_encryption_key: dek } = credentials;
    function throwIfNull<T>(descriptor: string) {
      return (x: T | null) => {
        if (x === null) {
          throw new Error(`${descriptor} was null, but should have a value`);
        }

        return x;
      };
    }

    // ensure result really does match the type
    function cleanResult(spec: {
      encrypted: boolean;
      value: string | null;
      value_verification_key: string | null;
    }): SDKDecryptedSlot {
      const decrypted: any = {
        ...slot,
        ...spec,
      };

      delete decrypted.encrypted_value;
      delete decrypted.encrypted_value_verification_key;

      return decrypted;
    }

    if (!slot.encrypted) {
      return cleanResult({
        encrypted: false,
        value: null,
        value_verification_key: null,
      });
    } else if (slot.encrypted_value === null) {
      // need to check encrypted_value as binaries will also have `encrypted: true`
      return cleanResult({
        encrypted: true,
        value: null,
        value_verification_key: null,
      });
    }

    const value = await SlotHelpers.cryppo
      .decryptStringWithKey({
        key: dek.key,
        serialized: slot.encrypted_value,
      })
      .then(throwIfNull('Slot decrypted value'));

    let decryptedValueVerificationKey: string | null = null;

    if (slot.encrypted_value_verification_key != null) {
      decryptedValueVerificationKey = await SlotHelpers.cryppo
        .decryptStringWithKey({
          serialized: slot.encrypted_value_verification_key,
          key: dek.key,
        })
        .then(throwIfNull('Slot decrypted value_verification_key'));

      if (
        !slot.own &&
        slot.value_verification_hash !== null &&
        !verifyHashedValue(
          <string>decryptedValueVerificationKey,
          value,
          slot.value_verification_hash
        )
      ) {
        throw new Error(
          `Decrypted slot ${slot.name} with value ${value} does not match original value.`
        );
      }
    }

    return cleanResult({
      encrypted: false,
      value,
      value_verification_key: decryptedValueVerificationKey,
    });
  }

  /**
   * Encrypt the value in the Slot. Undefined values are not changed.
   *
   * After successful encryption, Slot.encrypted = true and Slot.value is deleted.
   * @param slot
   * @param dek Data Encryption Key
   */
  static async encryptSlot<T extends { value?: string | null | undefined }>(
    credentials: IDEK,
    slot: T
  ): Promise<Omit<T, 'value'> & { encrypted: boolean; encrypted_value: string | undefined }> {
    const { data_encryption_key: dek } = credentials;
    const encrypted = {
      ...slot,
      encrypted: false,
      encrypted_value: undefined,
    };

    if (slot.value) {
      encrypted.encrypted_value = await SlotHelpers.cryppo
        .encryptWithKey({
          strategy: SlotHelpers.cryppo.CipherStrategy.AES_GCM,
          key: dek.key,
          data: slot.value,
        })
        .then(result => result.serialized);

      delete encrypted.value;
      encrypted.encrypted = true;
    }

    return encrypted;
  }

  /**
   * Add a verification hash and (encrypted) key to the Slot.
   * This is necessary to share an Item that you own.
   * If you do not own the Item, then just add the fields but leave them undefined.
   * @param slot
   * @param dek Data Encryption Key
   */
  public static async addVerificationHash<
    T extends { own: boolean; value: string | undefined | null }
  >(
    slot: T,
    dek: EncryptionKey
  ): Promise<
    T & {
      value_verification_hash: string | undefined;
      encrypted_value_verification_key: string | undefined;
    }
  > {
    if (slot.own && slot.value) {
      const valueVerificationKey = SlotHelpers.cryppo.generateRandomKey(
        VALUE_VERIFICATION_KEY_LENGTH
      ) as string;
      const verificationHash = SlotHelpers.valueVerificationHash(valueVerificationKey, slot.value);
      const encryptedValueVerificationKey = await SlotHelpers.cryppo
        .encryptWithKey({
          data: valueVerificationKey,
          key: dek.key,
          strategy: SlotHelpers.cryppo.CipherStrategy.AES_GCM,
        })
        .then(result => result.serialized);

      return {
        ...slot,
        encrypted_value_verification_key: encryptedValueVerificationKey,
        value_verification_hash: verificationHash,
      };
    } else {
      return {
        ...slot,
        encrypted_value_verification_key: undefined,
        value_verification_hash: undefined,
      };
    }
  }

  static anyDuplicateSlotNames(slots: Array<{ name?: string }>): boolean {
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

  static findWithEncryptedValue<T>(slots: T[]): T | undefined {
    return slots.find(s => s['encrypted_value'] != null);
  }

  /**
   * Convert Slot names to labels as per the backend URL-safe encoding.
   * For example `A Slot/name?` becomes `a_slot_name`.
   */
  static nameFromLabel(label: string): string {
    return parameterize(label, undefined, '_');
  }

  static async toEncryptedSlotValue(
    credentials: IDEK,
    slot: SDKDecryptedSlot
  ): Promise<EncryptedSlotValue> {
    const withHash = await SlotHelpers.addVerificationHash(slot, credentials.data_encryption_key);

    const {
      id,
      encrypted_value,
      encrypted_value_verification_key,
      value_verification_hash,
    } = await SlotHelpers.encryptSlot(credentials, withHash);

    // TODO due to an API bug, this doesn't typecheck when encrypted_value is undefined
    return {
      slot_id: id,
      encrypted_value,
      encrypted_value_verification_key,
      value_verification_hash,
    } as EncryptedSlotValue;
  }
}

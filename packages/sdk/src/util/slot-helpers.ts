import { EncryptedSlotValue, Slot } from '@meeco/vault-api-sdk';
import parameterize from 'parameterize';
import { SDKDecryptedSlot } from '../models/slot-types';
import { SymmetricKey } from '../models/symmetric-key';
import { IDEK } from '../services/service';
import {
  newValueVerificationKey,
  valueVerificationHash,
  verifyHashedValue,
} from './value-verification';

export default class SlotHelpers {
  // for mocking during testing
  private static valueVerificationHash =
    (<any>global).valueVerificationHash || valueVerificationHash;

  /**
   * Updates 'value' to the decrypted 'encrypted_value', decrypts encrypted_value_verification_key
   * and checks value_verification_hash (if present), and sets 'encrypted' to false.
   */
  static async decryptSlot(credentials: IDEK, slot: Slot): Promise<SDKDecryptedSlot> {
    const { data_encryption_key: dek } = credentials;

    // ensure result really does match the type
    function cleanResult(spec: {
      encrypted: boolean;
      value: string | null;
      value_verification_key: SymmetricKey | null;
    }): SDKDecryptedSlot {
      const decrypted: any = {
        ...slot,
        ...spec,
      };

      delete decrypted.encrypted_value;
      delete decrypted.encrypted_value_verification_key;

      return decrypted;
    }

    if (slot.encrypted_value == null) {
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

    const value: string = (await dek.decryptString(slot.encrypted_value))!;

    let decryptedValueVerificationKey: SymmetricKey | null = null;

    if (
      slot.encrypted_value_verification_key !== null &&
      slot.encrypted_value_verification_key !== undefined
    ) {
      decryptedValueVerificationKey = await dek.decryptKey(slot.encrypted_value_verification_key);

      if (
        !slot.own &&
        slot.value_verification_hash !== null &&
        !verifyHashedValue(decryptedValueVerificationKey!, value, slot.value_verification_hash)
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
   * @param dek Data Encryption Key
   */
  static async encryptSlot<
    T extends {
      value?: string | null | undefined;
      value_verification_key?: SymmetricKey | null | undefined;
    }
  >(
    credentials: IDEK,
    slot: T
  ): Promise<
    Omit<T, 'value' | 'value_verification_key'> & {
      encrypted: boolean;
      encrypted_value: string | undefined;
      encrypted_value_verification_key: string | undefined;
    }
  > {
    const { data_encryption_key: dek } = credentials;
    const encrypted = {
      ...slot,
      encrypted: false,
      encrypted_value: <string | undefined>undefined,
      encrypted_value_verification_key: <string | undefined>undefined,
    };

    if (slot.value) {
      encrypted.encrypted_value = (await dek.encryptString(slot.value))!;

      delete encrypted.value;
      encrypted.encrypted = true;
    }

    if (slot.value_verification_key) {
      encrypted.encrypted_value_verification_key = await dek.encryptKey(
        slot.value_verification_key
      );

      delete encrypted.value_verification_key;
    }

    return encrypted;
  }

  /**
   * Add a verification hash and key to the Slot.
   * This is necessary to share an Item that you own.
   * This should only be done for items you own, not on-shared items!
   */
  public static async addHashAndKey(slot: SDKDecryptedSlot): Promise<SDKDecryptedSlot> {
    if (!slot.own) {
      throw new Error('Overwriting verification hash of a non-owned Slot');
    }

    if (slot.value) {
      const valueVerificationKey = newValueVerificationKey();
      const verificationHash = SlotHelpers.valueVerificationHash(valueVerificationKey, slot.value);

      return {
        ...slot,
        value_verification_key: valueVerificationKey,
        value_verification_hash: verificationHash,
      };
    } else {
      return slot;
    }
  }

  static anyDuplicateSlotNames(slots: { name?: string }[]): boolean {
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

  /**
   * Encrypts a slot and adds verification hash and verification key for sharing.
   * Use to POST share data.
   */
  static async toEncryptedSlotValue(
    credentials: IDEK,
    slot: SDKDecryptedSlot
  ): Promise<EncryptedSlotValue> {
    let withHash = slot;
    if (slot.own) {
      withHash = await SlotHelpers.addHashAndKey(slot);
    } else {
      // re-encrypt key, keep hash
      if (slot.value && (!slot.value_verification_hash || !slot.value_verification_key)) {
        throw Error('value verification key or hash missing in on-shared slot');
      }

      // verification hash must be null (API constraint)
      withHash = {
        ...slot,
        value_verification_hash: null,
      };
    }

    const { id, encrypted_value, encrypted_value_verification_key, value_verification_hash } =
      await SlotHelpers.encryptSlot(credentials, withHash);

    // TODO due to an API bug, this doesn't typecheck when encrypted_value is undefined
    return {
      slot_id: id,
      encrypted_value,
      encrypted_value_verification_key,
      value_verification_hash,
    } as EncryptedSlotValue;
  }
}

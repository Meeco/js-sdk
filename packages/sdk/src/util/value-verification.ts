import { bytesToBinaryString, hmacSha256Digest } from '@meeco/cryppo';
import { SymmetricKey } from '../models/symmetric-key';

export const VALUE_VERIFICATION_KEY_LENGTH = 64;

export function newValueVerificationKey(): SymmetricKey {
  return SymmetricKey.generate(VALUE_VERIFICATION_KEY_LENGTH);
}

/**
 * Verify integrity of shared Slot Values using message authentication hashing.
 * @param verificationKey Recommended to be 64 bytes long.
 * @param value Plaintext to hash.
 */
export function valueVerificationHash(verificationKey: SymmetricKey, value: string) {
  return hmacSha256Digest(bytesToBinaryString(verificationKey.key), value);
}

export function verifyHashedValue(
  verificationKey: SymmetricKey,
  value: string,
  hash: string
): boolean {
  return valueVerificationHash(verificationKey, value) === hash;
}

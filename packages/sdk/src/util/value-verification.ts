import { hmacSha256Digest } from '@meeco/cryppo/dist/src/digests/hmac-digest';

/**
 * Verify integrity of shared Slot Values using message authentication hashing.
 * @param verificationKey Recommended to be 64 bytes long.
 * @param value Plaintext to hash.
 */
export function valueVerificationHash(verificationKey: string, value: string) {
  return hmacSha256Digest(verificationKey, value);
}

export function verifyHashedValue(verificationKey: string, value: string, hash: string): boolean {
  return valueVerificationHash(verificationKey, value) === hash;
}

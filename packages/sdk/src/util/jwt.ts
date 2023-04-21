import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { createJWT, decodeJWT, EdDSASigner } from 'did-jwt';
import { Ed25519 } from '../models/did-management';

export function signUnsignedJWT(unsignedJWT: string, issuer: string, key: Ed25519) {
  if (unsignedJWT.split('.').length > 2) {
    throw new Error('Credential already contains a signature');
  }

  const signer = EdDSASigner(generateKeyPairFromSeed(key.keyPair.secret()).secretKey);
  const decoded = decodeJWT(`${unsignedJWT}.unsigned`);

  return createJWT(decoded.payload, { issuer: issuer, signer }, decoded.header);
}

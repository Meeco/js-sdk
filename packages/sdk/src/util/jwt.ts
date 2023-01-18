import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { createJWS, createJWT, decodeJWT, EdDSASigner, JWTPayload } from 'did-jwt';
import { Ed25519 } from '../models/did-management';

export function signUnsignedJWT(unsignedJWT: string, issuerDID: string, key: Ed25519) {
  const SELF_ISSUED_V2 = 'https://self-issued.me/v2';
  const SELF_ISSUED_V2_VC_INTEROP = 'https://self-issued.me/v2/openid-vc';

  if (unsignedJWT.split('.').length > 2) {
    throw new Error('Credential already contains a signature');
  }

  const signer = EdDSASigner(generateKeyPairFromSeed(key.keyPair.secret()).secretKey);
  const decoded = decodeJWT(`${unsignedJWT}.unsigned`);

  //sign self issued Id_Token JWT
  if (decoded.payload.iss === SELF_ISSUED_V2 || decoded.payload.iss === SELF_ISSUED_V2_VC_INTEROP) {
    if (!signer) throw new Error('missing_signer: No Signer functionality has been configured');
    if (!decoded.header.typ) decoded.header.typ = 'JWT';
    if (!decoded.header.alg) decoded.header.alg = 'EdDSA';
    const timestamps: Partial<JWTPayload> = {
      iat: Math.floor(Date.now() / 1000),
    };

    const fullPayload = { ...timestamps, ...decoded.payload };
    return createJWS(fullPayload, signer, decoded.header);
  }

  return createJWT(decoded.payload, { issuer: issuerDID, signer }, decoded.header);
}

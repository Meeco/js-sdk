import { createJWT, decodeJWT, EdDSASigner, ES256KSigner, Signer } from 'did-jwt';

export enum SigningAlg {
  'ES256K' = 'ES256K',
  'EdDSA' = 'EdDSA',
}

export function signUnsignedJWT(
  unsignedJWT: string,
  issuer: string,
  key: Uint8Array,
  alg: SigningAlg
) {
  if (unsignedJWT.split('.').length > 2) {
    throw new Error('Credential already contains a signature');
  }

  let signer: Signer;

  switch (alg) {
    case SigningAlg.ES256K:
      signer = ES256KSigner(key);
      break;
    case SigningAlg.EdDSA:
      signer = EdDSASigner(key);
      break;
    default:
      throw new Error(`Not supported signing alg parameter passed: ${alg}`);
  }

  const decoded = decodeJWT(`${unsignedJWT}.unsigned`);

  return createJWT(decoded.payload, { issuer, signer }, { ...decoded.header, alg });
}

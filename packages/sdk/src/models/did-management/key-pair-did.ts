import { ec, eddsa } from 'elliptic';

export interface IKeyPairDID {
  keyPair: eddsa.KeyPair | ec.KeyPair;
  sign(message: Uint8Array): Uint8Array;
  getPublicKeyBase58(): string;
  getPublicKeyHex(): string;
  getName(): string;
  getPublicKeyBase64URL(): string;
}

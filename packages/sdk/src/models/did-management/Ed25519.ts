// tslint:disable-next-line: no-var-requires
const b58 = require('bs58');

import { eddsa } from 'elliptic';
import { IKeyPairDID } from './key-pair-did';

export class Ed25519 implements IKeyPairDID {
  keyPair: eddsa.KeyPair;
  constructor(secret: Uint8Array) {
    const ed25519 = new eddsa('ed25519');
    this.keyPair = ed25519.keyFromSecret(Buffer.from(secret));
  }
  sign(message: Uint8Array): Uint8Array {
    return this.keyPair.sign(Buffer.from(message)).toBytes();
  }
  getPublicKeyBase58(): string {
    return b58.encode(this.keyPair.getPublic());
  }
  getPublicKeyHex(): string {
    return this.keyPair.getPublic('hex');
  }
}

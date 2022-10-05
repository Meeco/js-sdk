// tslint:disable-next-line: no-var-requires
const b58 = require('bs58');
import { eddsa } from 'elliptic';
import cryppo from '../../services/cryppo-service';
import { IKeyPairDID } from './key-pair-did';

export class Ed25519 implements IKeyPairDID {
  static keyType: 'ed25519' = 'ed25519';
  keyPair: eddsa.KeyPair;
  constructor(secret: Uint8Array) {
    const ed25519 = new eddsa(Ed25519.keyType);
    this.keyPair = ed25519.keyFromSecret(Buffer.from(secret));
  }
  getName(): string {
    return Ed25519.name;
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

  getPublicKeyBase64URL(): string {
    const pubKeyBuffer = Buffer.from(this.keyPair.getPublic());
    return cryppo.encodeSafe64(cryppo.bytesBufferToBinaryString(pubKeyBuffer));
  }
}

// tslint:disable-next-line: no-var-requires
const b58 = require('bs58');
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '@noble/hashes/utils';
import { bytesToBase64url } from 'did-jwt';
import { IKeyPairDID } from './key-pair-did';

export class Ed25519 implements IKeyPairDID {
  static keyType: 'ed25519' = 'ed25519';
  static SEED_LENGTH = 32;

  /**
   * In some cases you will find seed and privateKey used interchangeably. However, private key is calculates based on the seed.
   * @noble/* libraries expect seed to be passed and internally calculates private key where it is necessary.
   */
  private seed: Uint8Array;
  private publicKey: Uint8Array;

  constructor(seed: Uint8Array | string) {
    if (seed.length !== Ed25519.SEED_LENGTH) {
      throw new Error(`ed25519: seed must be ${Ed25519.SEED_LENGTH} bytes`);
    }

    this.seed = typeof seed === 'string' ? Buffer.from(seed, 'binary') : seed;
    this.publicKey = ed25519.getPublicKey(this.seed);
  }

  getName(): string {
    return Ed25519.name;
  }

  sign(message: Uint8Array): Uint8Array {
    return ed25519.sign(message, this.seed);
  }

  getPublicKeyBase58(): string {
    return b58.encode(this.publicKey);
  }

  getPublicKeyHex(): string {
    return bytesToHex(this.publicKey);
  }

  getPublicKeyBase64URL(): string {
    return bytesToBase64url(this.publicKey);
  }

  /**
   * Outside of IKeyPairDID interface scope
   */

  getPublic(): Uint8Array {
    return this.publicKey;
  }

  getSeed(): Uint8Array {
    return this.seed;
  }

  getSecretKey(): Uint8Array {
    const secretKey = new Uint8Array(64);
    secretKey.set(this.seed);
    secretKey.set(this.publicKey, 32);

    return secretKey;
  }
}

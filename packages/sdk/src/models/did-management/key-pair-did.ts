export interface IKeyPairDID {
  sign(message: Uint8Array): Uint8Array;
  getPublicKeyBase58(): string;
  getPublicKeyHex(): string;
  getName(): string;
  getPublicKeyBase64URL(): string;
}

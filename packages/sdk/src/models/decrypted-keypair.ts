import { Keypair as APIKeypair } from '@meeco/keystore-api-sdk';
import cryppo from '../services/cryppo-service';
import RSAPrivateKey from './rsa-private-key';
import RSAPublicKey from './rsa-public-key';
import { SymmetricKey } from './symmetric-key';

/**
 * An asymmetric encryption key pair, with the private key decrypted.
 */
export default class DecryptedKeypair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;

  static async new(keyBits = 4096): Promise<DecryptedKeypair> {
    const { privateKey, publicKey } = await cryppo.generateRSAKeyPair(keyBits);
    return new DecryptedKeypair(publicKey, privateKey);
  }

  /**
   * Decrypts a keypair from the Meeco Keystore.
   * @param masterKey Usually the user's key encryption key.
   * @param keypair From the API response.
   */
  static async fromAPI(masterKey: SymmetricKey, keypair: APIKeypair): Promise<DecryptedKeypair> {
    const { id, public_key, encrypted_serialized_key, external_identifiers } = keypair;
    // decrypt serialized private key, check correct
    const privateKey = await masterKey.decryptKey(encrypted_serialized_key);
    return new DecryptedKeypair(public_key, privateKey!.key, external_identifiers, id);
  }

  constructor(
    publicKey: string,
    privateKey: string,
    public externalIds: string[] = [],
    public keystoreId?: string
  ) {
    this.publicKey = new RSAPublicKey(publicKey);
    this.privateKey = new RSAPrivateKey(privateKey);
  }
}

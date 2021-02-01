import { DecryptedKeypair, SymmetricKey } from '@meeco/sdk';
import test from '@oclif/test';
import { expect } from 'chai';
import {
  decryptedPrivateKey,
  default as keypairResponse,
  serializedKEK,
} from '../fixtures/responses/keypair-response';

describe('DecryptedKeypair', () => {
  const kek = SymmetricKey.fromSerialized(serializedKEK);

  describe('#fromAPI', () => {
    it('decrypts the private key', async () => {
      const result = await DecryptedKeypair.fromAPI(kek, keypairResponse.keypair);
      expect(result.privateKey.pem).to.equal(decryptedPrivateKey);
    });

    test
      .add('input', () => ({ ...keypairResponse.keypair, public_key: '123' }))
      .add('result', ({ input }) => DecryptedKeypair.fromAPI(kek, input))
      .catch(/^Not an RSA public key.*/)
      .it('throws an error on bad public key');

    test
      .add('fakeVal', () => kek.encryptString('abcd123'))
      .add('input', ({ fakeVal }) => ({
        ...keypairResponse.keypair,
        encrypted_serialized_key: fakeVal!,
      }))
      .add('result', ({ input }) => DecryptedKeypair.fromAPI(kek, input))
      .catch(/^Not an RSA private key.*/)
      .it('throws an error on bad private key');

    test
      .add('input', () => ({
        ...keypairResponse.keypair,
        // the following was not encrypted with the above KEK
        encrypted_serialized_key:
          'Aes256Gcm.6xtPqA==.LS0tCml2OiAhYmluYXJ5IHwtCiAgWG9mS2U1WTBodmJPbVlrRAphdDogIWJpbmFyeSB8LQogIGErMi95SXZ2dnBMQytmeVdmYjVWekE9PQphZDogbm9uZQo=',
      }))
      .add('result', ({ input }) => DecryptedKeypair.fromAPI(kek, input))
      .catch(/^Decryption failed.*/)
      .it('throws an error on decryption failure');
  });

  describe('token encryption', () => {
    const input = 'abcd123';
    const keypair = new DecryptedKeypair(keypairResponse.keypair.public_key, decryptedPrivateKey);

    it('encrypts empty string', async () => {
      const cipher = await keypair.publicKey.encryptToken('');
      const result = await keypair.privateKey.decryptToken(cipher);
      expect(result).to.equal('');
    });

    it('encrypts and decrypts a string', async () => {
      const cipher = await keypair.publicKey.encryptToken(input);
      const result = await keypair.privateKey.decryptToken(cipher);
      expect(result).to.eql(input);
    });
  });

  describe('key encryption', () => {
    const keypair = new DecryptedKeypair(keypairResponse.keypair.public_key, decryptedPrivateKey);

    it('encrypts and decrypts a key', async () => {
      const cipher = await keypair.publicKey.encryptKey(kek);
      const result = await keypair.privateKey.decryptKey(cipher);
      expect(result!.key).to.eql(kek.key);
    });
  });
});

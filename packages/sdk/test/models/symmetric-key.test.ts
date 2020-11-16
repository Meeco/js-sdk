import * as cryppo from '@meeco/cryppo';
import { SymmetricKey } from '@meeco/sdk';
import { expect } from 'chai';

describe('SymmetricKey', () => {
  const serializedKey = 'GiTvbtXSEBLPQjkJh_Mrj2B6edg0Rf6vLBQPOacaLfs=';
  const rawKey = cryppo.decodeSafe64(serializedKey);

  describe('#fromSerialized', () => {
    it('reads the correct key', () => {
      expect(SymmetricKey.fromSerialized(serializedKey).key).to.eql(rawKey);
    });

    it('throws an error if given a raw key', () => {
      expect(() => SymmetricKey.fromSerialized(rawKey)).to.throw();
    });
  });

  describe('#fromRaw', () => {
    it('reads the correct key', () => {
      expect(SymmetricKey.fromRaw(rawKey).toJSON()).to.eql(serializedKey);
    });

    it('throws an error if given a serialized key', () => {
      expect(() => SymmetricKey.fromRaw(serializedKey)).to.throw();
    });
  });

  describe('string encryption', () => {
    const utf8String = '鍵键';
    const key = SymmetricKey.fromSerialized(serializedKey);

    it('encodes null as null', async () => {
      const cipher = await key.encryptString(null);
      expect(cipher).to.equal(null);
    });

    it('encodes empty string as null', async () => {
      const cipher = await key.encryptString('');
      expect(cipher).to.equal(null);
    });

    it('encrypts and decrypts a UTF-8 string', async () => {
      const cipher = await key.encryptString(utf8String);
      const result = await key.decryptString(cipher!);
      expect(result).to.eql(utf8String);
    });
  });

  describe('key encryption', () => {
    const key = SymmetricKey.fromSerialized(serializedKey);

    it('encrypts and decrypts a key', async () => {
      const cipher = await key.encryptKey(key);
      const result = await key.decryptKey(cipher);
      expect(result!.key).to.eql(rawKey);
    });
  });
});

import test from '@oclif/test';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import { createSandbox } from 'sinon';
import { AuthData } from '../src/models/auth-data';
import { EncryptionKey } from '../src/models/encryption-key';
import { Environment } from '../src/models/environment';
import { SRPSession } from '../src/models/srp-session';
import { _mockCryppo } from './mock-cryppo';

const outputFixture = (fileName: string) => join(__dirname, 'fixtures', 'outputs', fileName);
export const getOutputFixture = (fileName: string) => {
  return load(readFileSync(outputFixture(fileName), 'utf-8'));
};

const inputFixture = (fileName: string) => join(__dirname, 'fixtures', 'inputs', fileName);
export const getInputFixture = (fileName: string) => {
  return load(readFileSync(inputFixture(fileName), 'utf-8'));
};

export const testUserAuthFixture = getInputFixture('user-auth.input.yaml');

export const customTest = test
  .register('mockCryppo', _mockCryppo)
  .register('mockSRP', mockSRP);

export function mockSRP() {
  const sandbox = createSandbox();
  return {
    run: () => {
      sandbox.stub(SRPSession.prototype, 'createVerifier').callsFake(() => {
        return Promise.resolve({
          verifier: '000000000VERIFIER',
          salt: '00SALT',
        });
      });
      sandbox.stub(SRPSession.prototype, 'getClientPublic').callsFake(() => {
        return Promise.resolve('000000000CLIENTPUBLIC');
      });
      sandbox.stub(SRPSession.prototype, 'computeProofFromChallenge').callsFake(args => {
        return Promise.resolve(`${args.salt}:${args.serverPublic}:PROOF`);
      });
    },
    finally: () => {
      sandbox.restore();
    },
  };
}

export const buildTestAuthData = (config: {
  secret?: string,
  keystore_access_token: string,
  vault_access_token: string,
  data_encryption_key: string,
  key_encryption_key: string,
  passphrase_derived_key: string
}) => new AuthData({
  secret: config.secret || '',
  keystore_access_token: config.keystore_access_token,
  data_encryption_key: EncryptionKey.fromSerialized(config.data_encryption_key),
  key_encryption_key: EncryptionKey.fromSerialized(config.key_encryption_key),
  passphrase_derived_key: EncryptionKey.fromSerialized(config.passphrase_derived_key),
  vault_access_token: config.vault_access_token
});

export const testUserAuth = buildTestAuthData({
  ...testUserAuthFixture.metadata
});

const { vault, keystore } = getInputFixture('test-environment.input.yaml');
export const environment = new Environment({
  vault,
  keystore
});

const convertUndefinedObjectValuesRecursive = (obj: Object, replacement: any): Object => {
  if (Array.isArray(obj)) {
    const result: Object[] = [];
    obj.forEach(x => {
      if (typeof x === 'object' && x !== null) {
        result.push(convertUndefinedObjectValuesRecursive(x, replacement));
      } else {
        result.push(x);
      }
    });
    return result;
  } else {
    obj = { ...obj };
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'undefined') {
        obj[key] = replacement;
      } else if (typeof obj[key] == 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        obj[key] = convertUndefinedObjectValuesRecursive(obj[key], replacement);
      }
    });
    return obj;
  }
};
export const replaceUndefinedWithNull = (obj: Object) => {
  return convertUndefinedObjectValuesRecursive(obj, null);
};

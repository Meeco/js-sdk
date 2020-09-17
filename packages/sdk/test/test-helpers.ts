import test from '@oclif/test';
import { join } from 'path';
import { createSandbox } from 'sinon';
import { AuthData } from '../src/models/auth-data';
import { EncryptionKey } from '../src/models/encryption-key';
import { Environment } from '../src/models/environment';
import { SRPSession } from '../src/models/srp-session';
import { _mockCryppo } from './mock-cryppo';

// Temp soln: rather than using regex, test against keys for now
const dateKeys = ['validated_at', 'created_at', 'updated_at', 'last_state_transition_at'];
const dateReviver = (key, value) => {
  if (typeof value === 'string' && dateKeys.includes(key)) {
    return new Date(value);
  }
  return value;
};
const initDateValues = (fixture: any) => {
  return JSON.parse(JSON.stringify(fixture), dateReviver);
};

const outputFixture = (fileName: string) => join(__dirname, 'fixtures', 'outputs', fileName);
export const getOutputFixture = (fileName: string) => {
  return initDateValues(require(outputFixture(fileName)));
};

const inputFixture = (fileName: string) => join(__dirname, 'fixtures', 'inputs', fileName);
export const getInputFixture = (fileName: string) => {
  return initDateValues(require(inputFixture(fileName)));
};

export const testUserAuthFixture = getInputFixture('user-auth.input.json');

export const customTest = test.register('mockCryppo', _mockCryppo).register('mockSRP', mockSRP);

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
  secret?: string;
  keystore_access_token: string;
  vault_access_token: string;
  data_encryption_key: string;
  key_encryption_key: string;
  passphrase_derived_key: string;
}) =>
  new AuthData({
    secret: config.secret || '',
    keystore_access_token: config.keystore_access_token,
    data_encryption_key: EncryptionKey.fromSerialized(config.data_encryption_key),
    key_encryption_key: EncryptionKey.fromSerialized(config.key_encryption_key),
    passphrase_derived_key: EncryptionKey.fromSerialized(config.passphrase_derived_key),
    vault_access_token: config.vault_access_token,
  });

export const testUserAuth = buildTestAuthData({
  ...testUserAuthFixture,
});

const { vault, keystore } = getInputFixture('test-environment.input.json');
export const environment = new Environment({
  vault,
  keystore,
});

const undefinedToNullreplacer = (key, value) => {
  return typeof value === 'undefined' ? null : value;
};
const convertUndefinedWithNull = obj => {
  return JSON.parse(JSON.stringify(obj, undefinedToNullreplacer), dateReviver);
};
export const replaceUndefinedWithNull = obj => {
  return convertUndefinedWithNull(obj);
};

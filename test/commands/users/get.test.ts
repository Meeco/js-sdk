import { Session, SrpChallenge } from '@meeco/meeco-keystore-sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import * as Nock from 'nock';
import { VAULT_PAIR_EXTERNAL_IDENTIFIER } from '../../../src/util/constants';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('meeco users:get', () => {
  customTest
    .nock('https://keystore-sandbox.meeco.me', stubKeystore)
    .nock('https://api-sandbox.meeco.me', stubVault)
    .mockCryppo()
    .mockSRP()
    .stderr()
    .stdout()
    .run(['users:get', '-c', inputFixture('get-user.input.yaml'), ...testEnvironmentFile])
    .it('retrieves all user details with credentials provided in a yaml config file', ctx => {
      const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .nock('https://keystore-sandbox.meeco.me', stubKeystore)
    .nock('https://api-sandbox.meeco.me', stubVault)
    .mockCryppo()
    .mockSRP()
    .stderr()
    .stdout()
    .run([
      'users:get',
      '-s',
      '1.user-1.my_secret_key',
      '-p',
      '123.asupersecretpassphrase',
      ...testEnvironmentFile
    ])
    .it('retrieves all user details with credentials provided via command line flags', ctx => {
      const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function stubKeystore(api: Nock.Scope) {
  api
    .post('/srp/challenges', {
      srp_a: '000000000CLIENTPUBLIC',
      username: 'user-1'
    })
    .reply(200, {
      challenge: <SrpChallenge>{
        challenge_b: '00SERVERPUBLIC',
        challenge_salt: '00SALT'
      }
    });
  api
    .post('/srp/session', {
      srp_m: '00SALT:00SERVERPUBLIC:PROOF',
      srp_a: '000000000CLIENTPUBLIC',
      username: 'user-1'
    })
    .reply(200, {
      session: <Session>{
        session_authentication_string: 'keystore_auth_token'
      }
    });
  api
    .get('/key_encryption_key')
    .matchHeader('Authorization', 'keystore_auth_token')
    .reply(200, {
      key_encryption_key: {
        serialized_key_encryption_key: `key_encryption_key`
      }
    });
  api
    .get('/data_encryption_keys/data_encryption_key_id')
    .matchHeader('Authorization', 'keystore_auth_token')
    .reply(200, {
      data_encryption_key: {
        serialized_data_encryption_key: `data_encryption_key`
      }
    });
  api
    .get('/keypairs/external_id/auth')
    .matchHeader('Authorization', 'keystore_auth_token')
    .reply(200, {
      keypair: {
        public_key: '--PUBLIC_KEY--ABCD',
        encrypted_serialized_key: '--PRIVATE_KEY--12324',
        external_identifiers: [VAULT_PAIR_EXTERNAL_IDENTIFIER]
      }
    });
}

function stubVault(api: Nock.Scope) {
  api
    .get('/me')
    .matchHeader(
      'Authorization',
      [
        '[decrypted]vault_auth_token--PRIVATE_KEY--12324[decrypted with key_encryption_key[decrypted with derived_key_123.asupersecretpassphrase]]'
      ].join('')
    )
    .reply(200, {
      user: {
        id: 'vault_user',
        private_encryption_space_id: 'data_encryption_key_id'
      }
    });
  api
    .post('/session', {
      public_key: '--PUBLIC_KEY--ABCD'
    })
    .reply(200, {
      session: {
        encrypted_session_authentication_string: 'vault_auth_token'
      }
    });
}

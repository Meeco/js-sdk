import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('users:login', () => {
  customTest
    .stub(UserService.prototype, 'get', get as any)
    .stderr()
    .stdout()
    .run([
      'users:login',
      '-s',
      '1.mocked_generated_username.my_secret_key',
      '-p',
      '123.asupersecretpassphrase',
      ...testEnvironmentFile,
    ])
    .it('generates a token when given a secret and password', ctx => {
      const expected = readFileSync(outputFixture('create-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(UserService.prototype, 'get', get as any)
    .stderr()
    .stdout()
    .run([
      'users:login',
      ...testUserAuth,
      '-p',
      '123.asupersecretpassphrase',
      ...testEnvironmentFile,
    ])
    .it('generates a token when given an auth config)', ctx => {
      const expected = readFileSync(outputFixture('create-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function get(password, secret) {
  return Promise.resolve({
    data_encryption_key: 'cmFuZG9tbHlfZ2VuZXJhdGVkX2tleQ==',
    key_encryption_key: 'cmFuZG9tbHlfZ2VuZXJhdGVkX2tleQ==',
    keystore_access_token: 'keystore_auth_token',
    passphrase_derived_key: 'ZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2U=',
    secret,
    vault_access_token: '[decrypted]encrypted_vault_session_string--PRIVATE_KEY--12324',
  });
}

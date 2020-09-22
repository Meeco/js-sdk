import { SecretService, UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('users:create', () => {
  customTest
    .stub(UserService.prototype, 'create', create as any)
    .stderr()
    .stdout()
    .run([
      'users:create',
      '-s',
      '1.mocked_generated_username.my_secret_key',
      '-p',
      '123.asupersecretpassphrase',
      ...testEnvironmentFile,
    ])
    .it('generates a new user from command line flags (provided secret)', ctx => {
      const expected = readFileSync(outputFixture('create-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(SecretService.prototype, 'generateSecret', generateSecret as any)
    .stub(UserService.prototype, 'generateUsername', generateUsername as any)
    .stub(UserService.prototype, 'create', create as any)
    .stderr()
    .stdout()
    .run(['users:create', '-p', '123.asupersecretpassphrase', ...testEnvironmentFile])
    .it('generates a new user from command line flags (generated username)', ctx => {
      const expected = readFileSync(
        outputFixture('create-user-generated-username.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function generateUsername() {
  return Promise.resolve('mocked_generated_username');
}

function generateSecret() {
  return Promise.resolve('1.mocked_generated_username.Y3ZXUY-tKdUxt-i35BfF-RGn4ZN-uWAxHe');
}

function create(password, secret) {
  return Promise.resolve({
    data_encryption_key: 'cmFuZG9tbHlfZ2VuZXJhdGVkX2tleQ==',
    key_encryption_key: 'cmFuZG9tbHlfZ2VuZXJhdGVkX2tleQ==',
    keystore_access_token: 'keystore_auth_token',
    passphrase_derived_key: 'ZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2U=',
    secret,
    vault_access_token: '[decrypted]encrypted_vault_session_string--PRIVATE_KEY--12324',
  });
}

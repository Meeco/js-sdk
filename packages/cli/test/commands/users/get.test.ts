import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('meeco users:get', () => {
  customTest
    .stub(UserService.prototype, 'get', get as any)
    .stderr()
    .stdout()
    .run(['users:get', '-c', inputFixture('get-user.input.yaml'), ...testEnvironmentFile])
    .it('retrieves all user details with credentials provided in a yaml config file', ctx => {
      const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(UserService.prototype, 'get', get as any)
    .stderr()
    .stdout()
    .run([
      'users:get',
      '-s',
      '1.user-1.my_secret_key',
      '-p',
      '123.asupersecretpassphrase',
      ...testEnvironmentFile,
    ])
    .it('retrieves all user details with credentials provided via command line flags', ctx => {
      const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function get(password, secret) {
  return Promise.resolve({
    data_encryption_key: 'ZGF0YV9lbmNyeXB0aW9uX2tleVtkZWNyeXB0ZWQgd2l0aCBrZXlfZW5jcnlwdGlvbl9rZXlbZGVjcnlwdGVkIHdpdGggZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2VdXQ==',
    key_encryption_key: 'a2V5X2VuY3J5cHRpb25fa2V5W2RlY3J5cHRlZCB3aXRoIGRlcml2ZWRfa2V5XzEyMy5hc3VwZXJzZWNyZXRwYXNzcGhyYXNlXQ==',
    keystore_access_token: 'keystore_auth_token',
    passphrase_derived_key: 'ZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2U=',
    secret: '1.user-1.my_secret_key',
    vault_access_token: '[decrypted]vault_auth_token--PRIVATE_KEY--12324[decrypted with key_encryption_key[decrypted with derived_key_123.asupersecretpassphrase]]'
  });
}
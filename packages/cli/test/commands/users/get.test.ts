import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('users:get', () => {
  customTest
    .stub(UserService.prototype, 'getOrCreateVaultToken', getVaultToken as any)
    .stub(UserService.prototype, 'getUser', getUser as any)
    .stderr()
    .stdout()
    .run(['users:get', '-c', inputFixture('get-user.input.yaml'), ...testEnvironmentFile])
    .it(
      'retrieves all user details with credentials provided in a yaml config file [Deprecated]',
      ctx => {
        const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
        expect(ctx.stdout.trim()).to.contain(expected.trim());
      }
    );

  customTest
    .stub(UserService.prototype, 'getOrCreateVaultToken', getVaultToken as any)
    .stub(UserService.prototype, 'getUser', getUser as any)
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

  customTest
    .stub(UserService.prototype, 'getUser', getUser as any)
    .stderr()
    .stdout()
    .run(['users:get', ...testUserAuth, ...testEnvironmentFile])
    .it('retrieves all user details with an auth config file', ctx => {
      const expected = readFileSync(outputFixture('get-user.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function getVaultToken(password, secret) {
  return Promise.resolve(
    '[decrypted]vault_auth_token--PRIVATE_KEY--12324[decrypted with key_encryption_key[decrypted with derived_key_123.asupersecretpassphrase]]'
  );
}

function getUser(token) {
  return Promise.resolve({
    user: {
      id: '68a2cdb3-4a9d-42ac-83e7-d7e4967143a0',
      email: '',
      is_app_logging_enabled: false,
      track_events: true,
      track_usage: true,
      private_dek_external_id: '5c5d0d86-119d-4e2f-87c7-6503f60a97d5',
      accepted_terms: false,
      association_ids: [],
      user_type: null,
    },
    associations: [],
  });
}

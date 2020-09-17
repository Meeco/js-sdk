import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('users:get', () => {
  customTest
    .stub(UserService.prototype, 'get', get as any)
    .stub(UserService.prototype, 'getVaultUser', getVaultUser as any)
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
    .stub(UserService.prototype, 'get', get as any)
    .stub(UserService.prototype, 'getVaultUser', getVaultUser as any)
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
    data_encryption_key:
      'ZGF0YV9lbmNyeXB0aW9uX2tleVtkZWNyeXB0ZWQgd2l0aCBrZXlfZW5jcnlwdGlvbl9rZXlbZGVjcnlwdGVkIHdpdGggZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2VdXQ==',
    key_encryption_key:
      'a2V5X2VuY3J5cHRpb25fa2V5W2RlY3J5cHRlZCB3aXRoIGRlcml2ZWRfa2V5XzEyMy5hc3VwZXJzZWNyZXRwYXNzcGhyYXNlXQ==',
    keystore_access_token: 'keystore_auth_token',
    passphrase_derived_key: 'ZGVyaXZlZF9rZXlfMTIzLmFzdXBlcnNlY3JldHBhc3NwaHJhc2U=',
    secret,
    vault_access_token:
      '[decrypted]vault_auth_token--PRIVATE_KEY--12324[decrypted with key_encryption_key[decrypted with derived_key_123.asupersecretpassphrase]]',
  });
}

function getVaultUser(token) {
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

// function vaultAPIFactory(environment) {
//   return authConfig => ({
//     OrganizationsForVaultUsersApi: {
//       organizationsIdGet: id => {
//         return Promise.resolve({
//           organization: {
//             id: '00000000-0000-0000-0000-000000000000',
//             name: 'SuperData Inc.',
//             description: 'My super data handling organization',
//             url: 'https://superdata.example.com',
//             email: 'admin@superdata.example.com',
//             status: 'requested',
//             requestor_id: '00000000-0000-0000-0000-000000000000',
//             validated_by_id: null,
//             agent_id: null,
//             validated_at: null,
//             created_at: new Date('2020-06-23T08:38:32.915Z'),
//           },
//           services: [],
//         });
//       },
//     },
//   });
// }

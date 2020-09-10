// import { expect } from '@oclif/test';
// import { readFileSync } from 'fs';
// import * as nock from 'nock';
// import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

// describe('shares:info', () => {
//   customTest
//     .stdout()
//     .stderr()
//     .mockCryppo()
//     .nock('https://sandbox.meeco.me/vault', stubVault)
//     .nock('https://sandbox.meeco.me/keystore', stubKeystore)
//     .run(['shares:info', '-c', inputFixture('info-share.input.yaml'), ...testEnvironmentFile])
//     .it('shows share information between two users', ctx => {
//       const expected = readFileSync(outputFixture('info-share.output.yaml'), 'utf-8');
//       expect(ctx.stdout).to.contain(expected.trim());
//     });
// });

// function stubVault(api: nock.Scope) {
//   api
//     .get('/connections')
//     .matchHeader('Authorization', 'from_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       connections: [
//         {
//           id: 'from_user_connection_id',
//           encryption_space_id: 'from_user_shared_encryption_space_id',
//           other_user_connection_public_key: 'to_user_public_key',
//           user_id: 'to_user_id',
//         },
//       ],
//     });

//   api
//     .get('/connections')
//     .matchHeader('Authorization', 'to_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       connections: [
//         {
//           id: 'to_user_connection_id',
//           public_key: 'to_user_public_key',
//           encryption_space_id: 'to_user_shared_encryption_space_id',
//           user_id: 'from_user_id',
//         },
//       ],
//     });
// }

// function stubKeystore(api: nock.Scope) {
//   api
//     .get('/encryption_spaces/from_user_shared_encryption_space_id')
//     .matchHeader('Authorization', 'from_user_keystore_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       encryption_space_data_encryption_key: {
//         serialized_data_encryption_key: 'serialized_shared_data_encryption_key',
//       },
//     });
// }

// import { ShareService } from '@meeco/sdk';
// import { expect } from '@oclif/test';
// import { readFileSync } from 'fs';
// import * as nock from 'nock';
// import * as sinon from 'sinon';
// import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

// describe('shares:create', () => {
//   const constantDate = new Date(0);
//   customTest
//     .stdout()
//     .stderr()
//     .mockCryppo()
//     .stub(ShareService, 'Date', sinon.stub().returns(constantDate))
//     .nock('https://sandbox.meeco.me/vault', stubVault)
//     .nock('https://sandbox.meeco.me/keystore', stubKeystore)
//     .run(['shares:create', '-c', inputFixture('create-share.input.yaml'), ...testEnvironmentFile])
//     .it('can setup sharing between two users', ctx => {
//       const expected = readFileSync(outputFixture('create-share.output.yaml'), 'utf-8');
//       expect(ctx.stdout).to.contain(expected.trim());
//     });
// });

// function stubVault(api: nock.Scope) {
//   api
//     .get('/items/from_user_vault_item_to_share_id')
//     .matchHeader('Authorization', 'from_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       slots: [
//         {
//           id: 'slot_a',
//           encrypted: true,
//           encrypted_value: 'aes.slot_a',
//         },
//         {
//           id: 'slot_b',
//           encrypted: true,
//           encrypted_value: 'aes.slot_b',
//         },
//       ],
//       associations_to: [],
//       associations: [],
//       attachments: [],
//       classification_nodes: [],
//       shares: [],
//       thumbnails: [],
//     });

//   // Fetch connection
//   api
//     .get('/connections/from_user_connection_id')
//     .matchHeader('Authorization', 'from_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       connection: {
//         id: 'from_user_connection_id',
//         encryption_space_id: null, // not setup yet
//         other_user_connection_public_key: 'to_user_public_key',
//         user_id: 'to_user_id',
//       },
//     });

//   // Create encryption space for the connection
//   api
//     .post('/connections/from_user_connection_id/encryption_space', {
//       encryption_space_id: 'from_user_created_encryption_space_id',
//     })
//     .matchHeader('Authorization', 'from_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200);

//   api
//     .post('/shares', {
//       shares: [
//         {
//           distributable: false,
//           shareable_id: 'from_user_vault_item_to_share_id',
//           shareable_type: 'Item',
//           user_id: 'to_user_id',
//           encrypted_values: [
//             {
//               slot_id: 'slot_a',
//               encrypted_value:
//                 '[serialized][encrypted]aes.slot_a[decrypted with from_user_data_encryption_key][with randomly_generated_key]',
//             },
//             {
//               slot_id: 'slot_b',
//               encrypted_value:
//                 '[serialized][encrypted]aes.slot_b[decrypted with from_user_data_encryption_key][with randomly_generated_key]',
//             },
//           ],
//         },
//       ],
//     })
//     .matchHeader('Authorization', 'from_user_vault_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       shares: [
//         {
//           id: 'some_share',
//           expires_at: new Date(0),
//           created_at: new Date(0),
//           updated_at: new Date(0),
//           shareable_type: 'Item',
//           shareable_id: 'from_user_vault_item_to_share_id',
//         },
//       ],
//     });
// }

// function stubKeystore(api: nock.Scope) {
//   // Create a new private encryption space
//   api
//     .post('/encryption_spaces', {
//       encrypted_serialized_key: `[serialized][encrypted]randomly_generated_key[with from_user_key_encryption_key]`,
//     })
//     .matchHeader('Authorization', 'from_user_keystore_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       encryption_space_data_encryption_key: {
//         encryption_space_id: 'from_user_created_encryption_space_id',
//       },
//     });

//   // Save the shared data encryption key
//   api
//     .post('/shared_keys', {
//       encrypted_key: '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
//       external_id: 'from_user_created_encryption_space_id',
//       public_key: 'to_user_public_key',
//       key_metadata: { key_type: 'AES-GCM' },
//     })
//     .matchHeader('Authorization', 'from_user_keystore_access_token')
//     .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
//     .reply(200, {
//       shared_key: {},
//     });
// }

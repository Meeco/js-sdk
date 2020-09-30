import { ShareService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import * as nock from 'nock';
import sinon from 'sinon';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('shares:create', () => {
  const constantDate = new Date(1);
  const value_verification_hash =
    '925c874c3345fd71f24fafb7231432749cd8761b93e455da68187e666c25d341';
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .stub(
      ShareService,
      'generate_value_verification_hash',
      sinon.stub().returns(value_verification_hash)
    )
    .stub(ShareService, 'Date', sinon.stub().returns(constantDate))
    .nock('https://sandbox.meeco.me/vault', stubVault(false))
    .run([
      'shares:create',
      '-c',
      inputFixture('create-share.input.yaml'),
      '--onshare',
      '-d',
      '2020-12-30T13:00:00.000Z',
      ...testEnvironmentFile,
    ])
    .it('can setup sharing between two users', ctx => {
      const expected = readFileSync(outputFixture('create-share.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

describe('shares:create one slot', () => {
  const constantDate = new Date(1);
  const value_verification_hash =
    '925c874c3345fd71f24fafb7231432749cd8761b93e455da68187e666c25d341';
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .stub(
      ShareService,
      'generate_value_verification_hash',
      sinon.stub().returns(value_verification_hash)
    )
    .stub(ShareService, 'Date', sinon.stub().returns(constantDate))
    .nock('https://sandbox.meeco.me/vault', stubVault(true))
    .run([
      'shares:create',
      '-c',
      inputFixture('create-share-oneslot.input.yaml'),
      '-d',
      '2020-12-30T13:00:00.000Z',
      ...testEnvironmentFile,
    ])
    .it('can share a single slot', ctx => {
      const expected = readFileSync(outputFixture('create-share-oneslot.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function stubVault(shareSingleSlot: boolean) {
  return (api: nock.Scope) => {
    const value_verification_hash =
      '925c874c3345fd71f24fafb7231432749cd8761b93e455da68187e666c25d341';

    api
      .get('/items/from_user_vault_item_to_share_id')
      .matchHeader('Authorization', 'from_user_vault_access_token')
      .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
      .reply(200, {
        slots: [
          {
            id: 'slot_a',
            encrypted: true,
            encrypted_value: 'aes.slot_a',
            own: true,
          },
          ...(shareSingleSlot
            ? []
            : [
                {
                  id: 'slot_b',
                  encrypted: true,
                  encrypted_value: 'aes.slot_b',
                  own: true,
                },
              ]),
        ],
        associations_to: [],
        associations: [],
        attachments: [],
        classification_nodes: [],
        thumbnails: [],
      });

    // Fetch connection
    api
      .get('/connections/from_user_connection_id')
      .matchHeader('Authorization', 'from_user_vault_access_token')
      .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
      .reply(200, {
        connection: {
          own: {
            id: 'from_user_connection_id',
            user_id: 'from_user_id',
            user_public_key: 'from_user_public_key',
            user_keypair_external_id: 'from_user_keypair_external_id',
          },
          the_other_user: {
            id: 'to_user_connection_id',
            user_id: 'to_user_id',
            user_public_key: 'to_user_public_key',
            user_keypair_external_id: 'to_user_keypair_external_id',
          },
        },
      });

    if (!shareSingleSlot) {
      api
        .post('/items/from_user_vault_item_to_share_id/shares', {
          shares: [
            {
              expires_at: '2020-12-30T13:00:00.000Z',
              sharing_mode: 'anyone',
              acceptance_required: 'acceptance_not_required',
              recipient_id: 'to_user_id',
              public_key: 'to_user_public_key',
              keypair_external_id: 'to_user_keypair_external_id',
              slot_values: [
                {
                  slot_id: 'slot_a',
                  encrypted_value:
                    '[serialized][encrypted]aes.slot_a[decrypted with from_user_data_encryption_key][with randomly_generated_key]',
                  encrypted_value_verification_key:
                    '[serialized][encrypted]randomly_generated_key[with randomly_generated_key]',
                  value_verification_hash,
                },
                {
                  slot_id: 'slot_b',
                  encrypted_value:
                    '[serialized][encrypted]aes.slot_b[decrypted with from_user_data_encryption_key][with randomly_generated_key]',
                  encrypted_value_verification_key:
                    '[serialized][encrypted]randomly_generated_key[with randomly_generated_key]',
                  value_verification_hash,
                },
              ],
              encrypted_dek:
                '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
            },
          ],
        })
        .matchHeader('Authorization', 'from_user_vault_access_token')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(201, {
          shares: [
            {
              id: 'some_share',
              owner_id: 'from_user_id',
              sender_id: 'from_user_id',
              recipient_id: 'to_user_id',
              acceptance_required: 'acceptance_not_required',
              item_id: 'from_user_vault_item_to_share_id',
              slot_id: null,
              public_key: 'to_user_public_key',
              sharing_mode: 'owner',
              keypair_external_id: 'to_user_keypair_external_id',
              encrypted_dek:
                '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
              terms: '',
              created_at: new Date(1),
              expires_at: new Date(1),
            },
          ],
        });
    } else {
      api
        .post('/items/from_user_vault_item_to_share_id/shares', {
          shares: [
            {
              expires_at: '2020-12-30T13:00:00.000Z',
              sharing_mode: 'owner',
              acceptance_required: 'acceptance_not_required',
              slot_id: 'slot_a',
              recipient_id: 'to_user_id',
              public_key: 'to_user_public_key',
              keypair_external_id: 'to_user_keypair_external_id',
              slot_values: [
                {
                  slot_id: 'slot_a',
                  encrypted_value:
                    '[serialized][encrypted]aes.slot_a[decrypted with from_user_data_encryption_key][with randomly_generated_key]',
                  encrypted_value_verification_key:
                    '[serialized][encrypted]randomly_generated_key[with randomly_generated_key]',
                  value_verification_hash,
                },
              ],
              encrypted_dek:
                '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
            },
          ],
        })
        .matchHeader('Authorization', 'from_user_vault_access_token')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(201, {
          shares: [
            {
              id: 'some_share',
              owner_id: 'from_user_id',
              sender_id: 'from_user_id',
              recipient_id: 'to_user_id',
              acceptance_required: 'acceptance_not_required',
              item_id: 'from_user_vault_item_to_share_id',
              slot_id: 'slot_a',
              public_key: 'to_user_public_key',
              sharing_mode: 'owner',
              keypair_external_id: 'to_user_keypair_external_id',
              encrypted_dek:
                '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
              terms: '',
              created_at: new Date(1),
              expires_at: new Date(1),
            },
          ],
        });
    }
  };
}

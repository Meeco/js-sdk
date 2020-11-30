import { ShareService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { customTest, inputFixture, testEnvironmentFile } from '../../test-helpers';

describe('shares:create', () => {
  const testAuth = {
    data_encryption_key: {
      _value: 'from_user_data_encryption_key',
    },

    key_encryption_key: {
      _value: 'from_user_key_encryption_key',
    },
    keystore_access_token: 'from_user_keystore_access_token',
    passphrase_derived_key: {
      _value: '',
    },
    secret: undefined,
    vault_access_token: 'from_user_vault_access_token',
  };

  const stub1 = sinon.stub();
  stub1.returns({
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
        encrypted_dek: '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
        terms: '',
        created_at: new Date(1),
        expires_at: new Date(1),
      },
    ],
  });

  customTest
    .stdout()
    .stderr()
    .stub(ShareService.prototype, 'shareItem', stub1)
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
      expect(stub1.args[0]).to.deep.equal([
        testAuth,
        'from_user_connection_id',
        'from_user_vault_item_to_share_id',
        {
          expires_at: new Date('2020-12-30T13:00:00.000Z'),
          sharing_mode: 'anyone',
          acceptance_required: 'acceptance_not_required',
          terms: undefined,
        },
      ]);
    });

  const stub2 = sinon.stub();
  stub2.returns({
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
        encrypted_dek: '[serialized][rsa_encrypted]randomly_generated_key[with to_user_public_key]',
        terms: '',
        created_at: new Date(1),
        expires_at: new Date(1),
      },
    ],
  });

  customTest
    .stdout()
    .stderr()
    .stub(ShareService.prototype, 'shareItem', stub2)
    .run([
      'shares:create',
      '-c',
      inputFixture('create-share-oneslot.input.yaml'),
      '-d',
      '2020-12-30T13:00:00.000Z',
      ...testEnvironmentFile,
    ])
    .it('can share a single slot', ctx => {
      expect(stub2.args[0]).to.deep.equal([
        testAuth,
        'from_user_connection_id',
        'from_user_vault_item_to_share_id',
        {
          expires_at: new Date('2020-12-30T13:00:00.000Z'),
          sharing_mode: 'owner',
          slot_id: 'slot_a',
          acceptance_required: 'acceptance_not_required',
          terms: undefined,
        },
      ]);
    });
});

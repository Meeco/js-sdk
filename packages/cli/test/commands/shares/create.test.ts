import { ShareService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { customTest, inputFixture, testEnvironmentFile } from '../../test-helpers';

describe('shares:create', () => {
  const d = new Date();
  const current_year = d.getFullYear().toString();
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
        onsharing_permitted: true,
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
      current_year + '-12-30T13:00:00.000Z',
      ...testEnvironmentFile,
    ])
    .it('can setup sharing between two users', () => {
      const [, fromConnection, itemId, options] = stub1.args[0];
      expect(fromConnection).to.eql('from_user_connection_id');
      expect(itemId).to.eql('from_user_vault_item_to_share_id');
      expect(options).to.deep.equal({
        expires_at: new Date(current_year + '-12-30T13:00:00.000Z'),
        onsharing_permitted: true,
        acceptance_required: 'acceptance_not_required',
        terms: undefined,
      });
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
        onsharing_permitted: false,
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
      current_year + '-12-30T13:00:00.000Z',
      ...testEnvironmentFile,
    ])
    .it('can share a single slot', () => {
      expect(stub2.args[0][3]).to.deep.equal({
        expires_at: new Date(current_year + '-12-30T13:00:00.000Z'),
        onsharing_permitted: false,
        slot_id: 'slot_a',
        acceptance_required: 'acceptance_not_required',
        terms: undefined,
      });
    });
});

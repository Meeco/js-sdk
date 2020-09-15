import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:accept', () => {
  customTest
    .stdout()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run(['shares:accept', 'share1', ...testUserAuth, ...testEnvironmentFile])
    .it('builds a share template file from two users and an item', ctx => {
      const expected = readFileSync(outputFixture('accept-share.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function mockVault(api) {
  api
    .put('/incoming_shares/share1/accept')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      share: {
        id: 'share1',
        owner_id: '',
        sender_id: '',
        recipient_id: '',
        acceptance_required: 'acceptance_required',
        item_id: '',
        slot_id: null,
        public_key: '',
        sharing_mode: 'owner',
        keypair_external_id: null,
        encrypted_dek: null,
        terms: null,
        created_at: null,
        expires_at: null,
      },
    });
}

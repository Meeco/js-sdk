import { expect } from '@oclif/test';
import cli from 'cli-ux';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:accept', () => {
  customTest
    .stdout()
    .stub(cli, 'confirm', () => async () => 'Y')
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run(['shares:accept', 'share1', ...testUserAuth, ...testEnvironmentFile])
    .it('accepts a share with terms after confirmation', ctx => {
      const expected = readFileSync(outputFixture('accept-share.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stdout()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run(['shares:accept', '-y', 'share1', ...testUserAuth, ...testEnvironmentFile])
    .it('auto accepts a share with terms', ctx => {
      const expected = readFileSync(outputFixture('accept-share.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function mockVault(api) {
  api
    .get('/incoming_shares/share1')
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
        onsharing_permitted: false,
        keypair_external_id: null,
        encrypted_dek: null,
        terms: 'Accept these or else',
        created_at: null,
        expires_at: null,
      },
    });

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
        onsharing_permitted: false,
        keypair_external_id: null,
        encrypted_dek: null,
        terms: null,
        created_at: null,
        expires_at: null,
      },
    });
}

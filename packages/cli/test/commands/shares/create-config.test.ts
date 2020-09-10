import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('shares:create-config', () => {
  customTest
    .stdout()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'shares:create-config',
      '-f',
      inputFixture('connection-from.input.yaml'),
      '-c',
      'connection-id',
      '-i',
      'my-item',
      ...testEnvironmentFile,
    ])
    .it('builds a share template file from two users and an item', ctx => {
      const expected = readFileSync(outputFixture('create-config-share.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item: {},
  slots: [],
  associations_to: [],
  associations: [],
  attachments: [],
  classification_nodes: [],
  shares: [],
  thumbnails: [],
};

function mockVault(api) {
  api
    .get('/items/my-item')
    .matchHeader('Authorization', 'from_vault_access')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);

  api
    .get('/connections/connection-id')
    .matchHeader('Authorization', 'from_vault_access')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      connection: { own: { id: 'connection-id' } },
      the_other_user: { id: 'other-connection-id' },
    });
}

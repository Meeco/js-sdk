import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('shares:create-config with slot', () => {
  customTest
    .stdout()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'shares:create-config',
      '-f',
      inputFixture('connection-from.input.yaml'),
      '-c',
      outputFixture('create-connection.output.yaml'),
      '-i',
      outputFixture('create-item-from-template.output.yaml'),
      '-s',
      'Make',
      ...testEnvironmentFile,
    ])
    .it('builds a share template file from two users and an item', ctx => {
      const expected = readFileSync(outputFixture('create-config-share.output-slot.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function mockVault(api) {
  api
    .get('/connections/connection_id')
    .matchHeader('Authorization', 'from_vault_access')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      connection: { own: { id: 'connection-id' }, the_other_user: { id: 'other-connection-id' } },
    });
}

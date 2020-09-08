import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:get', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run(['items:get', 'my-item', ...testUserAuth, ...testEnvironmentFile])
    .it('returns an item with all slots decrypted', ctx => {
      const expected = readFileSync(outputFixture('get-item.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item: {
    created_at: new Date(0),
    updated_at: new Date(0),
    label: 'My Fave Foods',
    name: 'food',
    slot_ids: ['steak', 'pizza', 'yoghurt'],
  },
  slots: [
    {
      id: 'pizza',
      label: 'Pizza',
      name: 'pizza',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Hawaiian',
      encrypted: true,
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'steak',
      label: 'Steak',
      name: 'steak',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Rump',
      encrypted: true,
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'beer',
      label: 'Beer',
      name: 'beer',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Session Ale',
      encrypted: true,
      created_at: new Date(0),
      updated_at: new Date(0),
    },
  ],
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
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

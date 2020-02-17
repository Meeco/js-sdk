import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:create-config', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://api-sandbox.meeco.me', mockVault)
    .run(['items:create-config', 'food', ...testUserAuth, ...testEnvironmentFile])
    .it('builds an item template from an api template name', ctx => {
      const expected = readFileSync(outputFixture('create-config-item.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item_templates: [
    {
      name: 'food',
      slot_ids: ['steak', 'pizza', 'yoghurt']
    }
  ],
  slots: [
    {
      id: 'pizza',
      label: 'Pizza',
      name: 'pizza',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Hawaiian'
    },
    {
      id: 'steak',
      label: 'Steak',
      name: 'steak',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Rump'
    },
    {
      id: 'beer',
      label: 'Beer',
      name: 'beer',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Session Ale'
    }
  ]
};

function mockVault(api) {
  api
    .get('/item_templates')
    .query({
      'by_classification[scheme]': 'esafe',
      'by_classification[name]': 'esafe_templates'
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .reply(200, response);
}

import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('items:update', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'items:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('update-item.input.yaml')
    ])
    .it('Updates the item', ctx => {
      const expected = readFileSync(outputFixture('update-item.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

const response = {
  item: {
    created_at: new Date(0),
    updated_at: new Date(0),
    label: 'My Fave Foods',
    name: 'food',
    slot_ids: ['pizza']
  },
  slots: [
    {
      id: 'pizza',
      label: 'Pizza',
      name: 'pizza',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Supreme',
      encrypted: true,
      created_at: new Date(0),
      updated_at: new Date(0)
    }
  ],
  associations_to: [],
  associations: [],
  attachments: [],
  classification_nodes: [],
  shares: [],
  thumbnails: []
};

function mockVault(api) {
  api
    .get('/client_task_queue')
    .query({ supress_changing_state: true, state: 'todo' })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      client_tasks: [{}, {}]
    });
  api
    .get('/client_task_queue')
    .query({ supress_changing_state: true, state: 'in_progress' })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      client_tasks: [{}, {}, {}]
    });
  api
    .put('/items/my-item', {
      item: {
        label: 'My Fave Foods',
        slots_attributes: [
          {
            name: 'pizza',
            encrypted_value: '[serialized][encrypted]Supreme[with my_generated_dek]'
          },
          {
            name: 'steak',
            encrypted_value: '[serialized][encrypted][with my_generated_dek]',
            _destroy: true
          }
        ]
      }
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

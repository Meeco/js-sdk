import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('templates:info', () => {
  customTest
    .stderr()
    .stdout()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .query({
          'by_classification[scheme]': 'esafe',
          'by_classification[name]': 'esafe_templates'
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .run(['templates:info', 'drink', ...testUserAuth, ...testEnvironmentFile])
    .it('fetches info about a particular template', ctx => {
      const expected = readFileSync(outputFixture('info-template.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item_templates: [
    {
      created_at: new Date(0),
      updated_at: new Date(0),
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt']
    },
    {
      created_at: new Date(0),
      updated_at: new Date(0),
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer']
    }
  ],
  slots: [
    {
      id: 'pizza',
      created_at: new Date(0),
      updated_at: new Date(0)
    },
    {
      id: 'steak',
      created_at: new Date(0),
      updated_at: new Date(0)
    },
    {
      id: 'yoghurt',
      created_at: new Date(0),
      updated_at: new Date(0)
    },
    {
      id: 'water',
      created_at: new Date(0),
      updated_at: new Date(0)
    },
    {
      id: 'beer',
      created_at: new Date(0),
      updated_at: new Date(0)
    }
  ],
  attachments: [],
  thumbnails: [],
  classification_nodes: []
};

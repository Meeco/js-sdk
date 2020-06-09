import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  DEFAULT_CLASSIFICATION_NAME,
  DEFAULT_CLASSIFICATION_SCHEME
} from '../../../src/util/constants';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('templates:list', () => {
  customTest
    .stderr()
    .stdout()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .query({
          'by_classification[scheme]': DEFAULT_CLASSIFICATION_SCHEME,
          'by_classification[name]': DEFAULT_CLASSIFICATION_NAME
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .run(['templates:list', ...testUserAuth, ...testEnvironmentFile])
    .it('fetches a list of available templates', ctx => {
      const expected = readFileSync(outputFixture('list-templates.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const response = {
  item_templates: [
    {
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt']
    },
    {
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer']
    },
    {
      name: 'activities',
      slot_ids: ['sport', 'recreational']
    }
  ],
  slots: [],
  attachments: [],
  thumbnails: [],
  classification_nodes: []
};

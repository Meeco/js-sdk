import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

const DEFAULT_CLASSIFICATION_NAME = 'esafe';
const DEFAULT_CLASSIFICATION_SCHEME = 'esafe';

describe('templates:list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .it(
      'fetches a list of available templates (no classification scheme or name provided)',
      async () => {
        const service = vaultAPIFactory(environment)(testUserAuth).ItemTemplateApi;
        const result = await service.itemTemplatesGet();
        const expected = getOutputFixture('list-templates.output.yaml');

        const requiredTemplateNames = result.item_templates.map(x => x.name);
        expect(requiredTemplateNames).to.members(expected.spec);
      }
    );

  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .query({
          'by_classification[scheme]': DEFAULT_CLASSIFICATION_SCHEME,
          'by_classification[name]': DEFAULT_CLASSIFICATION_NAME,
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .it(
      'fetches a list of available templates scoped to classification scheme and name',
      async () => {
        const service = vaultAPIFactory(environment)(testUserAuth).ItemTemplateApi;
        const result = await service.itemTemplatesGet(
          DEFAULT_CLASSIFICATION_SCHEME,
          DEFAULT_CLASSIFICATION_NAME
        );
        const requiredTemplateNames = result.item_templates.map(x => x.name);

        const expected = getOutputFixture('list-templates.output.yaml');
        expect(requiredTemplateNames).to.members(expected.spec);
      }
    );
});

const response = {
  item_templates: [
    {
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt'],
    },
    {
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer'],
    },
    {
      name: 'activities',
      slot_ids: ['sport', 'recreational'],
    },
  ],
  slots: [],
  attachments: [],
  thumbnails: [],
  classification_nodes: [],
};

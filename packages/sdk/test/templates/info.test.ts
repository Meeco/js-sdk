import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import {
  customTest,
  environment,
  getOutputFixture,
  replaceUndefinedWithNull,
  testUserAuth,
} from '../test-helpers';

describe('templates:info', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/item_templates')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .it('fetches info about a particular template', async () => {
      const service = vaultAPIFactory(environment)(testUserAuth).ItemTemplateApi;
      const {
        slots: resultingSlots,
        item_templates: resultingTemplates,
      } = await service.itemTemplatesGet();

      const { slots: expectedSlots, ...expectedTemplate } = getOutputFixture(
        'info-template.output.yaml'
      ).spec;
      const requiredTemplate = resultingTemplates.find(template => template.name === 'drink')!;
      const requiredSlots = resultingSlots.filter(slot =>
        requiredTemplate.slot_ids.includes(slot.id)
      );

      expect(replaceUndefinedWithNull(requiredTemplate)).to.eql(expectedTemplate);
      expect(replaceUndefinedWithNull(requiredSlots)).to.deep.members(expectedSlots);
    });
});

const response = {
  item_templates: [
    {
      created_at: new Date(0),
      updated_at: new Date(0),
      name: 'food',
      slots_ids: ['steak', 'pizza', 'yoghurt'],
    },
    {
      created_at: new Date(0),
      updated_at: new Date(0),
      name: 'drink',
      slot_ids: ['yoghurt', 'water', 'beer'],
    },
  ],
  slots: [
    {
      id: 'pizza',
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'steak',
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'yoghurt',
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'water',
      created_at: new Date(0),
      updated_at: new Date(0),
    },
    {
      id: 'beer',
      created_at: new Date(0),
      updated_at: new Date(0),
    },
  ],
  attachments: [],
  thumbnails: [],
  classification_nodes: [],
};

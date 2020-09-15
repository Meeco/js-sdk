import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('items:create-config', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('builds an item template from an api template name', async () => {
      const service = vaultAPIFactory(environment)(testUserAuth).ItemTemplateApi;
      const {
        slots: resultSlots,
        item_templates: resultItemTemplates,
      } = await service.itemTemplatesGet();
      const resultTemplate = resultItemTemplates.find(template => template.name === 'food');
      const resultTemplateName = resultTemplate!.name;
      const resultSlotNames = resultSlots
        .filter(slot => resultTemplate!.slot_ids.includes(slot.name))
        .map(slot => slot.name);

      const expected = getOutputFixture('create-config-item.output.yaml');
      const expectedTemplateName = expected.metadata.template_name;
      const expectedSlotsNames = expected.spec.slots.map(slot => slot.name);

      expect(resultTemplateName).to.equal(expectedTemplateName);
      expect(resultSlotNames).to.members(expectedSlotsNames);
    });
});

const response = {
  item_templates: [
    {
      name: 'food',
      slot_ids: ['steak', 'pizza', 'yoghurt'],
    },
  ],
  slots: [
    {
      id: 'pizza',
      label: 'Pizza',
      name: 'pizza',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Hawaiian',
    },
    {
      id: 'steak',
      label: 'Steak',
      name: 'steak',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Rump',
    },
    {
      id: 'beer',
      label: 'Beer',
      name: 'beer',
      foo: 'bar',
      slot_type_name: 'key_value',
      encrypted_value: 'Session Ale',
    },
  ],
  attachments: [],
  thumbnails: [],
  classification_nodes: [],
};

function mockVault(api) {
  api
    .get('/item_templates')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

import { ItemApi, NestedSlotAttributes } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { ItemCreateData } from '../../src/models/item-create-data';
import { ItemService } from '../../src/services/item-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuth,
} from '../test-helpers';

describe('Item create', () => {
  customTest
    .stub(ItemApi.prototype, 'itemsPost', createItem as any)
    .it('creates an empty item from a template', async () => {
      const input = getInputFixture('create-item-from-template.input.json');

      const itemCreateData = new ItemCreateData({
        template_name: input.template_name,
        slots: [],
        item: { label: input.label },
      });
      const result = await new ItemService(environment).create(testUserAuth, itemCreateData);

      const expected = getOutputFixture('create-item-from-template.output.json');
      const { slots, ...expectedItem } = expected;
      expect(result.item).to.eql(expectedItem);
      expect(result.slots).to.deep.members(slots);
    });

  customTest
    .stub(ItemApi.prototype, 'itemsPost', createItem as any)
    .mockCryppo()
    .it('creates an item with slots provided in a config file', async () => {
      const input = getInputFixture('create-item-with-slots.input.json');

      const inputSlots: NestedSlotAttributes[] = [];
      input.slots.forEach(x => {
        inputSlots.push({
          ...x,
        });
      });

      const itemCreateData = new ItemCreateData({
        template_name: input.template_name,
        slots: inputSlots,
        item: { label: input.label },
      });
      const result = await new ItemService(environment).create(testUserAuth, itemCreateData);

      const expected = getOutputFixture('create-item-with-slots.output.json');
      const { slots, ...expectedItem } = expected;
      expect(result.item).to.eql(expectedItem);
      expect(result.slots).to.deep.members(slots);
    });
});

function createItem({ template_name, item }) {
  const slot_ids = ['a', 'b', 'c', 'd', 'e'];
  const update = { ...item };
  if (template_name === 'vehicle') {
    update.slots_attributes = [
      {
        id: 'a',
        name: 'Make',
      },
      {
        id: 'b',
        name: 'Model',
      },
    ];
  }
  const slots = (update.slots_attributes || []).map((slot, index) => ({
    ...slot,
    id: slot_ids[index],
  }));
  delete update.slots_attributes;
  return Promise.resolve({
    item: {
      id: 'item-foo',
      template_name,
      ...update,
      slot_ids: slots.map(slot => slot.id),
    },
    slots,
  });
}

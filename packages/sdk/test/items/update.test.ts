import { expect } from 'chai';
import nock from 'nock/types';
import { ItemUpdateData } from '../../src/models/item-update-data';
import { ItemService } from '../../src/services/item-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  replaceUndefinedWithNull,
  testUserAuth,
} from '../test-helpers';

describe('ItemService.update', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('Updates the item', async () => {
      const input = getInputFixture('update-item.input.json');
      const updateData = new ItemUpdateData({
        id: input.id,
        label: input.label,
        slots: input.slots,
      });
      const result = await new ItemService(environment).update(testUserAuth, updateData);

      const { slots: expectedSlots, thumbnails, attachments, ...expectedItem } = getOutputFixture(
        'update-item.output.json'
      );
      expect(replaceUndefinedWithNull(result.item)).to.eql(expectedItem);
      expect(replaceUndefinedWithNull(result.slots)).to.deep.members(expectedSlots);
    });
});

const response = {
  item: {
    created_at: new Date(1),
    updated_at: new Date(1),
    label: 'My Fave Foods',
    name: 'food',
    slot_ids: ['pizza'],
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
      created_at: new Date(1),
      updated_at: new Date(1),
    },
  ],
  associations_to: [],
  associations: [],
  attachments: [],
  classification_nodes: [],
  shares: [],
  thumbnails: [],
};

function mockVault(api: nock.Scope) {
  api
    .put('/items/my-item', {
      item: {
        label: 'My Fave Foods',
        slots_attributes: [
          {
            name: 'pizza',
            encrypted_value: '[serialized][encrypted]Supreme[with my_generated_dek]',
          },
          {
            name: 'steak',
            _destroy: true,
          },
        ],
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

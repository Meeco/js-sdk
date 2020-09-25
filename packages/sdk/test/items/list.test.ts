import { expect } from '@oclif/test';
import { ItemService } from '../../src/services/item-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import {
  customTest,
  environment,
  getOutputFixture,
  replaceUndefinedWithNull,
  testUserAuth,
} from '../test-helpers';

describe('Items list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/items')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response)
    )
    .it('list items that the user has', async () => {
      const result = await new ItemService(environment).list(testUserAuth.vault_access_token);

      const expected = getOutputFixture('list-items.output.json');
      expect(replaceUndefinedWithNull(result.items)).to.deep.members(expected);
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/items')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/items')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2)
    )
    .it('list items that the user has', async () => {
      const result = await new ItemService(environment).listAll(testUserAuth.vault_access_token);

      const expected = getOutputFixture('list-items.output.json');
      expect(replaceUndefinedWithNull(result.items)).to.deep.members(expected);
    });
});

const response = {
  items: [
    {
      id: 'a',
      name: 'My Car',
      slot_ids: ['make_model'],
      created_at: new Date(1),
      updated_at: new Date(1),
    },
    {
      id: 'b',
      name: 'My House',
      slot_ids: ['add'],
      created_at: new Date(1),
      updated_at: new Date(1),
    },
  ],
  slots: [
    {
      id: 'make_model',
      name: 'Make and Model',
      value: 'Tesla Model S',
      created_at: new Date(1),
      updated_at: new Date(1),
    },
    {
      id: 'add',
      name: 'address',
      value: '123 Fake Street',
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
  meta: [],
};

const responsePart1 = {
  ...response,
  items: [response.items[0]],
  slots: [response.slots[0]],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [{ next_page_exists: true }],
};

const responsePart2 = {
  ...response,
  items: [response.items[1]],
  slots: [response.slots[1]],
};

import { expect } from '@oclif/test';
import { ItemService } from '../../src/services/item-service';
import { customTest, environment, getOutputFixture, replaceUndefinedWithNull, testUserAuth } from '../test-helpers';

describe('Items list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .get('/items')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          items: [
            {
              id: 'a',
              name: 'My Car',
              slot_ids: ['make_model'],
              created_at: new Date(0),
              updated_at: new Date(0),
            },
            {
              id: 'b',
              name: 'My House',
              slot_ids: ['add'],
              created_at: new Date(0),
              updated_at: new Date(0),
            },
          ],
          slots: [
            {
              id: 'make_model',
              name: 'Make and Model',
              value: 'Tesla Model S',
              created_at: new Date(0),
              updated_at: new Date(0),
            },
            {
              id: 'add',
              name: 'address',
              value: '123 Fake Street',
              created_at: new Date(0),
              updated_at: new Date(0),
            },
          ],
          associations_to: [],
          associations: [],
          attachments: [],
          classification_nodes: [],
          shares: [],
          thumbnails: [],
        })
    )
    .it('list items that the user has', async () => {
      const result = await new ItemService(environment).list(testUserAuth.vault_access_token);

      const expected = getOutputFixture('list-items.output.yaml');
      expect(replaceUndefinedWithNull(result.items)).to.deep.members(expected.spec);
    });
});

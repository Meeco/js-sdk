import { ItemService } from '../../src/services/item-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('Items remove-slot', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/slots/my_slot_id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .it('removes a slot from an item', async () => {
      await new ItemService(environment).removeSlot(testUserAuth, 'my_slot_id');
    });
});

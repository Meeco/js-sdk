import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:remove-slot', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/slots/my_slot_id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .stdout()
    .stderr()
    .run(['items:remove-slot', 'my_slot_id', ...testUserAuth, ...testEnvironmentFile])
    .it('removes a slot from an item', ctx => {
      expect(ctx.stderr).to.contain('Slot successfully removed');
    });
});

import { ItemService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:remove-slot', () => {
  customTest
    .stub(ItemService.prototype, 'removeSlot', removeSlot as any)
    .stdout()
    .stderr()
    .run(['items:remove-slot', 'my_slot_id', ...testUserAuth, ...testEnvironmentFile])
    .it('removes a slot from an item', ctx => {
      expect(ctx.stdout.trim()).to.contain('Slot successfully removed');
    });
});

function removeSlot(slotId, vaultAccessToken) {
  return Promise.resolve();
}
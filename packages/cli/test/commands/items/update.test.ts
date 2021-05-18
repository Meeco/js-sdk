import { ClientTaskQueueService, ItemService, SlotType } from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import sinon from 'sinon';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('items:update', () => {
  customTest
    .stub(
      ClientTaskQueueService.prototype,
      'countOutstandingTasks',
      sinon.stub().returns({
        todo: 2,
        in_progress: 3,
      })
    )
    .stub(ItemService.prototype, 'update', update as any)
    .stdout()
    .stderr()
    .run([
      'items:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('update-item.input.yaml'),
    ])
    .it('Updates the item', ctx => {
      const expected = readFileSync(outputFixture('update-item.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function update(vaultAccessToken, dataEncryptionKey, updateData) {
  return Promise.resolve({
    attachments: [],
    classification_nodes: [],
    item: {
      id: null,
      own: null,
      name: 'food',
      label: 'My Fave Foods',
      description: null,
      created_at: new Date(1),
      item_template_id: null,
      ordinal: null,
      visible: null,
      updated_at: new Date(1),
      item_template_label: null,
      image: null,
      item_image: null,
      item_image_background_colour: null,
      classification_node_ids: null,
      slot_ids: ['pizza'],
      me: null,
      background_color: null,
      original_id: null,
      owner_id: null,
      share_id: null,
    },
    slots: [
      {
        id: 'pizza',
        own: null,
        share_id: null,
        name: 'pizza',
        description: null,
        encrypted: true,
        ordinal: null,
        visible: null,
        classification_node_ids: null,
        attachment_id: null,
        item_id: null,
        required: null,
        updated_at: new Date(1),
        created_at: new Date(1),
        slot_type_name: SlotType.KeyValue,
        creator: null,
        encrypted_value: 'Supreme',
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        label: 'Pizza',
        original_id: null,
        owner_id: null,
      },
    ],
    thumbnails: [],
  });
}

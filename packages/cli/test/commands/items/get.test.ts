import { ItemService, SlotType } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:get', () => {
  customTest
    .stdout()
    .stderr()
    .stub(ItemService.prototype, 'get', get as any)
    .run(['items:get', 'my-item', ...testUserAuth, ...testEnvironmentFile])
    .it('returns an item with all slots decrypted', ctx => {
      const expected = readFileSync(outputFixture('get-item.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function get(itemId, vaultAccessToken, dataEncryptionKey) {
  return Promise.resolve({
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
      association_ids: null,
      associations_to_ids: null,
      slot_ids: ['steak', 'pizza', 'yoghurt'],
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
        encrypted: false,
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
        encrypted_value: 'Hawaiian',
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        image: null,
        label: 'Pizza',
        original_id: null,
        owner_id: null,
        value: 'Hawaiian[decrypted with my_generated_dek]',
      },
      {
        id: 'steak',
        own: null,
        share_id: null,
        name: 'steak',
        description: null,
        encrypted: false,
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
        encrypted_value: 'Rump',
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        image: null,
        label: 'Steak',
        original_id: null,
        owner_id: null,
        value: 'Rump[decrypted with my_generated_dek]',
      },
      {
        id: 'beer',
        own: null,
        share_id: null,
        name: 'beer',
        description: null,
        encrypted: false,
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
        encrypted_value: 'Session Ale',
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        image: null,
        label: 'Beer',
        original_id: null,
        owner_id: null,
        value: 'Session Ale[decrypted with my_generated_dek]',
      },
    ],
    thumbnails: [],
    attachments: [],
  });
}

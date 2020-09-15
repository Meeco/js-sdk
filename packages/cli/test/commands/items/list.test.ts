import { ItemService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:list', () => {
  customTest
    .stub(ItemService.prototype, 'list', list as any)
    .stdout()
    .run(['items:list', ...testUserAuth, ...testEnvironmentFile])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function list(vaultAccessToken: string) {
  return Promise.resolve({
    next_page_after: null,
    associations: [],
    associations_to: [],
    attachments: [],
    thumbnails: [],
    classification_nodes: [],
    slots: [
      {
        id: 'make_model',
        own: null,
        share_id: null,
        name: 'Make and Model',
        description: null,
        encrypted: null,
        ordinal: null,
        visible: null,
        classification_node_ids: null,
        attachment_id: null,
        slotable_id: null,
        slotable_type: null,
        required: null,
        updated_at: new Date(0),
        created_at: new Date(0),
        slot_type_name: null,
        creator: null,
        encrypted_value: null,
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        image: null,
        label: null,
        original_id: null,
        owner_id: null
      },
      {
        id: 'add',
        own: null,
        share_id: null,
        name: 'address',
        description: null,
        encrypted: null,
        ordinal: null,
        visible: null,
        classification_node_ids: null,
        attachment_id: null,
        slotable_id: null,
        slotable_type: null,
        required: null,
        updated_at: new Date(0),
        created_at: new Date(0),
        slot_type_name: null,
        creator: null,
        encrypted_value: null,
        encrypted_value_verification_key: null,
        value_verification_hash: null,
        image: null,
        label: null,
        original_id: null,
        owner_id: null
      }
    ],
    items: [
      {
        id: 'a',
        own: null,
        name: 'My Car',
        label: null,
        description: null,
        created_at: new Date(0),
        item_template_id: null,
        ordinal: null,
        visible: null,
        updated_at: new Date(0),
        item_template_label: null,
        image: null,
        item_image: null,
        item_image_background_colour: null,
        classification_node_ids: null,
        association_ids: null,
        associations_to_ids: null,
        slot_ids: ['make_model'],
        me: null,
        background_color: null,
        original_id: null,
        owner_id: null,
        share_id: null
      },
      {
        id: 'b',
        own: null,
        name: 'My House',
        label: null,
        description: null,
        created_at: new Date(0),
        item_template_id: null,
        ordinal: null,
        visible: null,
        updated_at: new Date(0),
        item_template_label: null,
        image: null,
        item_image: null,
        item_image_background_colour: null,
        classification_node_ids: null,
        association_ids: null,
        associations_to_ids: null,
        slot_ids: ['add'],
        me: null,
        background_color: null,
        original_id: null,
        owner_id: null,
        share_id: null
      }
    ],
    meta: null
  });
}

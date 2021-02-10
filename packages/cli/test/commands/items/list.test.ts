import { ItemService, SlotType } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('items:list', () => {
  customTest
    .stub(ItemService.prototype, 'list', list as any)
    .stdout()
    .run(['items:list', ...testUserAuth, ...testEnvironmentFile])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stub(ItemService.prototype, 'listAll', list as any)
    .stdout()
    .run(['items:list', ...testUserAuth, ...testEnvironmentFile, ...testGetAll])
    .it('lists all items that the user has when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stub(ItemService.prototype, 'list', list as any)
    .stdout()
    .run([
      'items:list',
      '--templateIds',
      'e30a36a5-6cd3-4d58-b838-b3a96384beab',
      '--templateIds',
      'e25b48c9-4011-4020-a96d-7f5116680db4',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(ItemService.prototype, 'list', list as any)
    .stdout()
    .run([
      'items:list',
      '--classification',
      'pets',
      '--classification',
      'vehicles',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(ItemService.prototype, 'list', list as any)
    .stdout()
    .run([
      'items:list',
      '--sharedWith',
      '79277a11-ad81-4f86-afda-8ac1b9b72079',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(outputFixture('list-items.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function list(vaultAccessToken: string) {
  return Promise.resolve(response);
}

const response = {
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
      item_id: null,
      required: null,
      updated_at: new Date(1),
      created_at: new Date(1),
      slot_type_name: SlotType.KeyValue,
      creator: null,
      encrypted_value: null,
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: null,
      original_id: null,
      owner_id: null,
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
      item_id: null,
      required: null,
      updated_at: new Date(1),
      created_at: new Date(1),
      slot_type_name: SlotType.KeyValue,
      creator: null,
      encrypted_value: null,
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: null,
      original_id: null,
      owner_id: null,
    },
  ],
  items: [
    {
      id: 'a',
      own: null,
      name: 'My Car',
      label: null,
      description: null,
      created_at: new Date(1),
      item_template_id: 'e30a36a5-6cd3-4d58-b838-b3a96384beab',
      ordinal: null,
      visible: null,
      updated_at: new Date(1),
      item_template_label: 'Vehicle',
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
      share_id: null,
    },
    {
      id: 'b',
      own: null,
      name: 'My Dog',
      label: null,
      description: null,
      created_at: new Date(1),
      item_template_id: 'e25b48c9-4011-4020-a96d-7f5116680db4',
      ordinal: null,
      visible: null,
      updated_at: new Date(1),
      item_template_label: 'Pet',
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
      share_id: null,
    },
  ],
  meta: [],
};

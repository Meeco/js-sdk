import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('items:create-config', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run(['items:create-config', 'food', ...testUserAuth, ...testEnvironmentFile])
    .it('builds an item template from an api template name', ctx => {
      const expected = readFileSync(outputFixture('create-config-item.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

const templates = {
  next_page_after: null,
  attachments: [],
  thumbnails: [],
  classification_nodes: [],
  slots: [
    {
      id: 'pizza',
      own: null,
      share_id: null,
      name: 'pizza',
      description: null,
      encrypted: null,
      ordinal: null,
      visible: null,
      classification_node_ids: null,
      attachment_id: null,
      slotable_id: null,
      slotable_type: null,
      required: null,
      updated_at: null,
      created_at: null,
      slot_type_name: 'key_value',
      creator: null,
      encrypted_value: 'Hawaiian',
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: 'Pizza',
      original_id: null,
      owner_id: null,
    },
    {
      id: 'steak',
      own: null,
      share_id: null,
      name: 'steak',
      description: null,
      encrypted: null,
      ordinal: null,
      visible: null,
      classification_node_ids: null,
      attachment_id: null,
      slotable_id: null,
      slotable_type: null,
      required: null,
      updated_at: null,
      created_at: null,
      slot_type_name: 'key_value',
      creator: null,
      encrypted_value: 'Rump',
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: 'Steak',
      original_id: null,
      owner_id: null,
    },
    {
      id: 'beer',
      own: null,
      share_id: null,
      name: 'beer',
      description: null,
      encrypted: null,
      ordinal: null,
      visible: null,
      classification_node_ids: null,
      attachment_id: null,
      slotable_id: null,
      slotable_type: null,
      required: null,
      updated_at: null,
      created_at: null,
      slot_type_name: 'key_value',
      creator: null,
      encrypted_value: 'Session Ale',
      encrypted_value_verification_key: null,
      value_verification_hash: null,
      image: null,
      label: 'Beer',
      original_id: null,
      owner_id: null,
    },
  ],
  item_templates: [
    {
      id: null,
      name: 'food',
      description: null,
      ordinal: null,
      visible: null,
      user_id: null,
      updated_at: null,
      image: null,
      template_type: null,
      classification_node_ids: null,
      slot_ids: ['steak', 'pizza', 'yoghurt'],
      label: null,
      background_color: null,
    },
  ],
  meta: null,
};

function vaultAPIFactory(environment) {
  return authConfig => ({
    ItemTemplateApi: {
      itemTemplatesGet: (classificationScheme, classificationName) => Promise.resolve(templates),
    },
  });
}

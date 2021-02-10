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
    .stub(ItemService.prototype, 'list', listFilterByClassificationNodeName as any)
    .stdout()
    .run([
      'items:list',
      '--classificationNodeName',
      'pets',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(
        outputFixture('list-items.filter.by.classification.name.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });

  customTest
    .stub(ItemService.prototype, 'list', listFilterByClassificationNodeNames as any)
    .stdout()
    .run([
      'items:list',
      '--classificationNodeName',
      'pets,vehicles',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('list items that the user has', ctx => {
      const expected = readFileSync(
        outputFixture('list-items.filter.by.classification.names.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

function list(vaultAccessToken: string) {
  return Promise.resolve(response);
}

function listFilterByClassificationNodeName(vaultAccessToken: string) {
  return Promise.resolve(responseFilterClassificaitonNodeName);
}

function listFilterByClassificationNodeNames(vaultAccessToken: string) {
  return Promise.resolve(responseFilterClassificaitonNodeNames);
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
      name: 'My House',
      label: null,
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

const responseFilterClassificaitonNodeName = {
  next_page_after: null,
  associations: [],
  associations_to: [],
  attachments: [],
  thumbnails: [],
  classification_nodes: [
    {
      id: '63c4d73c-7539-4a05-aca5-d1121dbea625',
      name: 'pets',
      label: 'Pets',
      description: null,
      ordinal: 7,
      background_color: '#FF00FF',
      image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      scheme: 'esafe',
    },
  ],
  slots: [],
  items: [
    {
      id: '16e7534e-440e-4e71-abe5-1161d0a0af53',
      own: true,
      name: 'pet',
      label: 'dpog',
      description: null,
      created_at: '2021-02-09T06:57:18.896Z',
      item_template_id: 'e30a36a5-6cd3-4d58-b838-b3a96384beab',
      ordinal: 1,
      visible: true,
      updated_at: '2021-02-09T06:57:20.035Z',
      item_template_label: 'Pet',
      image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      item_image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      item_image_background_colour: null,
      classification_node_ids: [
        'e13545cb-6413-4968-8cad-da0fcb9cb2ae',
        '63c4d73c-7539-4a05-aca5-d1121dbea625',
      ],
      association_ids: [],
      associations_to_ids: [],
      slot_ids: [
        '4f90a04f-f322-48bb-9436-3cb59fb8cf6b',
        'b9cc1b04-4a33-4553-a0f7-5da50ee94bff',
        '7f651b81-7e86-4585-b2ce-1c13524d45ac',
      ],
      me: false,
      background_color: null,
      original_id: null,
      owner_id: '1984193b-0ad8-4f35-8a19-f7e05354986a',
      share_id: null,
    },
  ],
  meta: [],
};

const responseFilterClassificaitonNodeNames = {
  next_page_after: null,
  associations: [],
  associations_to: [],
  attachments: [],
  thumbnails: [],
  classification_nodes: [
    {
      id: '29254384-fb50-490a-9256-56fc8838a52d',
      name: 'vehicles',
      label: 'Vehicles',
      description: null,
      ordinal: 3,
      background_color: '#FF00FF',
      image: 'https://vault-stage.meeco.me/images/3b7d5b9d-39bd-4dd6-8bfd-b4a0b6368c2d',
      scheme: 'esafe',
    },
    {
      id: '63c4d73c-7539-4a05-aca5-d1121dbea625',
      name: 'pets',
      label: 'Pets',
      description: null,
      ordinal: 7,
      background_color: '#FF00FF',
      image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      scheme: 'esafe',
    },
  ],
  slots: [],
  items: [
    {
      id: '794989f6-9de3-48f6-a379-32373e3e4a73',
      own: true,
      name: 'vehicle',
      label: 'My Vehicle',
      description: null,
      created_at: '2021-02-04T02:00:26.286Z',
      item_template_id: 'e25b48c9-4011-4020-a96d-7f5116680db4',
      ordinal: 1,
      visible: true,
      updated_at: '2021-02-08T04:57:18.751Z',
      item_template_label: 'Vehicle',
      image: 'https://vault-stage.meeco.me/images/3b7d5b9d-39bd-4dd6-8bfd-b4a0b6368c2d',
      item_image: 'https://vault-stage.meeco.me/images/3b7d5b9d-39bd-4dd6-8bfd-b4a0b6368c2d',
      item_image_background_colour: null,
      classification_node_ids: [
        'e13545cb-6413-4968-8cad-da0fcb9cb2ae',
        '29254384-fb50-490a-9256-56fc8838a52d',
      ],
      association_ids: [],
      associations_to_ids: [],
      slot_ids: [],
      me: false,
      background_color: null,
      original_id: null,
      owner_id: '1984193b-0ad8-4f35-8a19-f7e05354986a',
      share_id: null,
    },
    {
      id: '16e7534e-440e-4e71-abe5-1161d0a0af53',
      own: true,
      name: 'pet',
      label: 'dpog',
      description: null,
      created_at: '2021-02-09T06:57:18.896Z',
      item_template_id: 'e30a36a5-6cd3-4d58-b838-b3a96384beab',
      ordinal: 1,
      visible: true,
      updated_at: '2021-02-09T06:57:20.035Z',
      item_template_label: 'Pet',
      image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      item_image: 'https://vault-stage.meeco.me/images/d178065a-5ab0-4658-b974-622dda574511',
      item_image_background_colour: null,
      classification_node_ids: [
        'e13545cb-6413-4968-8cad-da0fcb9cb2ae',
        '63c4d73c-7539-4a05-aca5-d1121dbea625',
      ],
      association_ids: [],
      associations_to_ids: [],
      slot_ids: [],
      me: false,
      background_color: null,
      original_id: null,
      owner_id: '1984193b-0ad8-4f35-8a19-f7e05354986a',
      share_id: null,
    },
  ],
  meta: [],
};

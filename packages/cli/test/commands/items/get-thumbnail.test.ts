import * as FileStorageNode from '@meeco/file-storage-node';
import { ItemService, SlotType } from '@meeco/sdk';
import { expect } from '@oclif/test';
import * as fileUtils from '../../../src/util/file';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

const singleBluePixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
  'base64'
);

describe('items:get-thumbnail', () => {
  let written;
  beforeEach(() => {
    written = false;
  });

  customTest
    .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
      expect(path).to.eql('./thumbnail.jpg');
      expect(contents).to.eql(singleBluePixel);
      expect(options).to.eql({
        flag: 'wx',
      });
      written = true;
      return Promise.resolve();
    }))
    .stub(ItemService.prototype, 'get', get as any)
    .stub(FileStorageNode, 'downloadThumbnail', downloadThumbnail as any)
    .stdout()
    .stderr()
    .run([
      'items:get-thumbnail',
      'my_item_id',
      'my_slot_id',
      'my_thumbnail_id',
      '-o',
      './',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('downloads, decrypts and saves an thumbnail to a file', () => {
      expect(written).to.eql(true);
    });

  customTest
    .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
      return Promise.reject({
        code: 'EEXIST',
      });
    }))
    .stub(ItemService.prototype, 'get', get as any)
    .stub(FileStorageNode, 'downloadThumbnail', downloadThumbnail as any)
    .stdout()
    .stderr()
    .run([
      'items:get-thumbnail',
      'my_item_id',
      'my_slot_id',
      'my_thumbnail_id',
      '-o',
      './',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .catch(err =>
      expect(err.message)
        .to.contain('The destination file')
        .and.to.contain('exists')
    )
    .it('does not overwrite existing files');

  customTest
    .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
      return Promise.reject({
        code: 'OTHER',
      });
    }))
    .stub(ItemService.prototype, 'get', get as any)
    .stub(FileStorageNode, 'downloadThumbnail', downloadThumbnail as any)
    .stdout()
    .stderr()
    .run([
      'items:get-thumbnail',
      'my_item_id',
      'my_slot_id',
      'my_thumbnail_id',
      '-o',
      './',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .catch(err => expect(err.message).to.contain('Failed to write to destination file'))
    .it('handles other file write errors');
});

function downloadThumbnail(thumbnailId, vaultAccessToken, dataEncryptionKey) {
  return Promise.resolve(singleBluePixel);
}

function get(itemId, vaultAccessToken, dataEncryptionKey) {
  return Promise.resolve({
    item: {
      id: 'my_item_id',
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
      slot_ids: ['steak', 'pizza', 'yoghurt'],
      me: null,
      background_color: null,
      original_id: null,
      owner_id: null,
      share_id: null,
    },
    slots: [
      {
        id: 'my_slot_id',
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
        label: 'Beer',
        original_id: null,
        owner_id: null,
        value: 'Session Ale[decrypted with my_generated_dek]',
      },
    ],
    thumbnails: [
      {
        id: 'my_thumbnail_id',
        size_type: '256x256/jpg',
      },
    ],
    attachments: [],
  });
}

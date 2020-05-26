import { stringAsBinaryBuffer } from '@meeco/cryppo/dist/src/util';
import { expect } from '@oclif/test';
import * as mime from 'mime-types';
import { Scope } from 'nock';
import * as fileUtils from '../../../src/util/file';
import { customTest, inputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

const singleBluePixel = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==`;

describe('items:attach-file', () => {
  customTest
    .stub(fileUtils, 'readFileAsBuffer', path => {
      expect(path).to.eql('./my/secret/file.txt');
      return Promise.resolve(stringAsBinaryBuffer(singleBluePixel));
    })
    .stub(mime, 'lookup', path => {
      if (path === './my/secret/file.txt') {
        return 'image/png';
      } else {
        return 'text/plain';
      }
    })
    .nock('https://sandbox.meeco.me/vault', mockVaultApi)
    .stdout()
    .stderr()
    .run([
      'items:attach-file',
      '-c',
      inputFixture('file-attachment.input.yaml'),
      ...testUserAuth,
      ...testEnvironmentFile
    ])
    .it('encrypts and uploads a file to a slot', ctx => {
      expect(ctx.stderr).to.contain('File was successfully attached');
    });
});

function mockVaultApi(api: Scope) {
  api
    .get('/items/test_item_id')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      item: {
        id: 'my_test_item_id'
      },
      slots: [],
      associations_to: [],
      associations: [],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: []
    });

  api
    .post('/attachments', body => {
      // Test data key is 128bit
      expect(body).to.contain('Aes128Gcm');
      expect(body).to.contain('file.txt');
      expect(body).to.contain('image/png');
      return true;
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      attachment: {
        id: 'new_attachment_id'
      }
    });

  api
    .put('/items/my_test_item_id', {
      item: {
        slots_attributes: [
          {
            label: 'My Secret File',
            slot_type_name: 'attachment',
            attachments_attributes: [
              {
                id: 'new_attachment_id'
              }
            ]
          }
        ]
      }
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      item: {
        id: 'my_test_item_id'
      },
      slots: [],
      associations_to: [],
      associations: [],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: []
    });
}

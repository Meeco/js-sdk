import { expect } from '@oclif/test';
import * as mime from 'mime-types';
import { Scope } from 'nock';
import * as fileUtils from '../../../src/util/file';
import { customTest, inputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

const singleBluePixel = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==`;
const textFile = 'Hello, World!';

const mockFileRead: any = (path: string) => {
  if (path === './my/secret/file.txt') {
    return Promise.resolve(Buffer.from(textFile, 'binary'));
  } else if (path === './my/secret/image.png') {
    return Promise.resolve(Buffer.from(singleBluePixel, 'base64'));
  }
};

const mockLookup: any = (path: string) => {
  if (path === './my/secret/image.png') {
    return 'image/png';
  } else if (path === './my/secret/file.txt') {
    return 'text/plain';
  } else {
    return 'text/plain';
  }
};

describe('items:attach-file', () => {
  customTest
    .stub(fileUtils, 'readFileAsBuffer', mockFileRead)
    .stub(mime, 'lookup', mockLookup)
    .nock('https://sandbox.meeco.me/vault', mockApisForText)
    .stdout()
    .stderr()
    .run([
      'items:attach-file',
      '-c',
      inputFixture('text-file-attachment.input.yaml'),
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('encrypts and uploads a file to a slot', ctx => {
      expect(ctx.stderr).to.contain('File was successfully attached');
    });

  customTest
    .stub(fileUtils, 'readFileAsBuffer', mockFileRead)
    .stub(mime, 'lookup', mockLookup)
    .nock('https://sandbox.meeco.me/vault', mockApisForImage)
    .stdout()
    .stderr()
    .run([
      'items:attach-file',
      '-c',
      inputFixture('image-file-attachment.input.yaml'),
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('generates and uploads a thumbnail for the binary if it is an image', ctx => {
      expect(ctx.stderr).to.contain('File was successfully attached');
      expect(ctx.stderr).to.not.contain('Error');
    });
});

function mockDefaults(api: Scope) {
  api
    .get('/items/test_item_id')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      item: {
        id: 'my_test_item_id',
      },
      slots: [],
      associations_to: [],
      associations: [],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
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
                id: 'new_attachment_id',
              },
            ],
          },
        ],
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      item: {
        id: 'my_test_item_id',
      },
      slots: [],
      associations_to: [],
      associations: [],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
    });
}

function mockApisForImage(api: Scope) {
  mockDefaults(api);
  api
    .post('/thumbnails', body => {
      // Test data key is 128bit
      expect(body).to.contain('Aes128Gcm');
      expect(body).to.contain('png_256x256'); // the content is text because it's encrypted but we send up the `sizeType` property
      return true;
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      thumbnail: {
        id: 'new_thumbnail_id',
      },
    });

  api
    .post('/attachments', body => {
      // Test data key is 128bit
      expect(body).to.contain('Aes128Gcm');
      expect(body).to.contain('image.png');
      expect(body).to.contain('image/png');
      return true;
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      attachment: {
        id: 'new_attachment_id',
      },
    });
}

function mockApisForText(api: Scope) {
  mockDefaults(api);

  api
    .post('/attachments', body => {
      // Test data key is 128bit
      expect(body).to.contain('Aes128Gcm');
      expect(body).to.contain('file.txt');
      expect(body).to.contain('text/plain');
      return true;
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      attachment: {
        id: 'new_attachment_id',
      },
    });
}

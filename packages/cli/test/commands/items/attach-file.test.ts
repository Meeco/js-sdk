import { ItemService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import * as mime from 'mime-types';
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
    .stub(ItemService.prototype, 'attachFile', attachFile as any)
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
    .stub(ItemService.prototype, 'attachFile', attachFile as any)
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
    });
});

function attachFile() {
  return Promise.resolve();
}

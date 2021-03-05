// import * as fs from 'fs';
import sinon = require('sinon');
import { ThumbnailService } from '../src/thumbnail-service';
import { EncryptionKey } from '@meeco/cryppo';
import { ThumbnailTypes } from '@meeco/file-storage-common';
import { expect } from 'chai';
import * as cryppo from '@meeco/cryppo';

describe('ThumbnailService', () => {
  describe('#download', () => {
    it('downloads a file', () => {});

    it('reports a missing id', () => {});

    it('reports decryption failure', () => {});
  });

  describe('#upload', () => {
    it('uploads a file', async () => {
      // sinon.stub(fs, 'readFileSync').returns(Buffer.from([0]));
      sinon
        .stub(cryppo, 'encryptWithKey')
        .resolves({ serialized: 'abdDEF=' } as cryppo.IEncryptionResult);

      const fetchAPI = sinon.spy();

      const result = await new ThumbnailService('abc.com', cryppo, fetchAPI).upload({
        thumbnailFilePath:
          '/home/naver/git/meeco/js-sdk/packages/file-storage-node/test/linux-thumb.png',
        binaryId: '123',
        attachmentDek: EncryptionKey.generateRandom(),
        sizeType: ThumbnailTypes[4],
        authConfig: {},
      });

      expect(result).to.be.true;
      // encrypts a file
      // sets correct url
      // sets correct headers
    });

    it('reports a missing file', () => {});
  });
});

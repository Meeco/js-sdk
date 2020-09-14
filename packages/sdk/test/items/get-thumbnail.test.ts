import {
  binaryBufferToString,
  CipherStrategy,
  encryptWithKey,
  stringAsBinaryBuffer
} from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/sdk';
import { ThumbnailApi } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { ItemService } from '../../src/services/item-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

const singleBluePixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
  'base64'
);

describe('items:get-thumbnail', () => {
  customTest
    .stub(ThumbnailApi.prototype, 'thumbnailsIdGet', <any>(id => {
      expect(id).to.eql('my_thumbnail_id');
      return Promise.resolve({
        async arrayBuffer() {
          const pixelString = binaryBufferToString(singleBluePixel);
          const dek = EncryptionKey.fromSerialized('bXlfZ2VuZXJhdGVkX2Rlaw==');
          const encryptedPixel = await encryptWithKey({
            data: pixelString,
            key: dek.key,
            strategy: CipherStrategy.AES_GCM,
          });
          return stringAsBinaryBuffer(encryptedPixel.serialized);
        },
      });
    }))
    .it('downloads, decrypts thumbnail', async () => {
      const decryptedContents = await new ItemService(environment).downloadThumbnail(
        'my_thumbnail_id',
        testUserAuth.vault_access_token,
        testUserAuth.data_encryption_key
      );

      expect(singleBluePixel.equals(stringAsBinaryBuffer(decryptedContents))).equals(true);
    });
});

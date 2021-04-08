import * as cryppo from '@meeco/cryppo';
import { IFileStorageAuthConfiguration, ThumbnailTypes } from '@meeco/file-storage-common';
import { fancy } from 'fancy-test';
import { ThumbnailService } from '../src/thumbnail-service';
import sinon = require('sinon');

const mock = require('mock-fs');

const fakeVault = 'https://sandbox.meeco.me/vault';
const fakeAuth: IFileStorageAuthConfiguration = {
  vault_access_token: 'vaultToken',
  subscription_key: 'subKey',
  oidc_token: 'oidc',
};

describe('ThumbnailService', () => {
  describe('#download', () => {
    // TODO: this is mostly within common code
    fancy
      .nock(fakeVault, api => {
        api
          .get(`/thumbnails/id`)
          .reply(200, { redirect_url: fakeVault + '/some_url' })
          .get('/some_url')
          .matchHeader('authorizationoidc2', fakeAuth.oidc_token!)
          .matchHeader('Meeco-Subscription-Key', fakeAuth.subscription_key!)
          .reply(200, '123abc');
      })
      .add(
        'service',
        () =>
          new ThumbnailService(fakeVault, {
            decryptWithKey: sinon.stub().resolves(new Uint8Array()),
          } as any)
      )
      .do(
        async ({ service }) =>
          await service.download({
            id: 'id',
            dataEncryptionKey: {} as cryppo.EncryptionKey,
            authConfig: fakeAuth,
          })
      )
      .it('downloads a file');

    fancy
      .nock(fakeVault, api => {
        api.get(`/thumbnails/id`).reply(404);
      })
      .add('service', () => new ThumbnailService(fakeVault))
      .do(
        async ({ service }) =>
          await service.download({
            id: 'id',
            dataEncryptionKey: {} as cryppo.EncryptionKey,
            authConfig: fakeAuth,
          })
      )
      .catch('Could not get Thumbnail URL. Http code: 404')
      .it('reports a missing file');

    fancy
      .nock(fakeVault, api => {
        api
          .get(`/thumbnails/id`)
          .reply(200, { redirect_url: fakeVault + '/some_url' })
          .get('/some_url')
          .reply(404);
      })
      .add('service', () => new ThumbnailService(fakeVault))
      .do(
        async ({ service }) =>
          await service.download({
            id: 'id',
            dataEncryptionKey: {} as cryppo.EncryptionKey,
            authConfig: fakeAuth,
          })
      )
      .catch('Thumbnail not found')
      .it('reports a bad download URL');

    fancy
      .nock(fakeVault, api => {
        api
          .get(`/thumbnails/id`)
          .reply(200, { redirect_url: fakeVault + '/some_url' })
          .get('/some_url')
          .matchHeader('authorizationoidc2', fakeAuth.oidc_token!)
          .matchHeader('Meeco-Subscription-Key', fakeAuth.subscription_key!)
          .reply(200, '123abc');
      })
      .add(
        'service',
        () =>
          new ThumbnailService(fakeVault, {
            decryptWithKey: sinon.stub().throws(Error('decryption error')),
          } as any)
      )
      .do(
        async ({ service }) =>
          await service.download({
            id: 'id',
            dataEncryptionKey: {} as cryppo.EncryptionKey,
            authConfig: fakeAuth,
          })
      )
      .catch('Failed to decrypt downloaded file: decryption error')
      .it('reports decryption failure');
  });

  describe('#upload', () => {
    fancy
      .nock(fakeVault, api => {
        api
          .post('/thumbnails')
          // TODO headers are not sent, ok?
          // TODO content uploaded as FormData, hard to test
          .reply(201, { thumbnail: {} });
      })
      .add('service', () => {
        mock({
          'some/file.txt': 'abcd',
        });

        sinon
          .stub(cryppo, 'encryptWithKey')
          .resolves({ serialized: 'abdDEF=' } as cryppo.IEncryptionResult);

        return new ThumbnailService(fakeVault, cryppo);
      })
      .do(async ({ service }) => {
        await service.upload({
          thumbnailFilePath: 'some/file.txt',
          binaryId: '123',
          attachmentDek: cryppo.EncryptionKey.generateRandom(),
          sizeType: ThumbnailTypes[4],
          authConfig: {},
        });
      })
      .it('uploads a file');

    fancy
      .add('service', () => new ThumbnailService(fakeVault, cryppo))
      .do(async ({ service }) => {
        await service.upload({
          thumbnailFilePath: 'non-existing-file',
          binaryId: '123',
          attachmentDek: {} as cryppo.EncryptionKey,
          sizeType: ThumbnailTypes[4],
          authConfig: {},
        });
      })
      .catch(/.* no such file .*/)
      .it('reports a missing file');
  });
});

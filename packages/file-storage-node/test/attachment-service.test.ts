import * as cryppo from '@meeco/cryppo';
import { EncryptionKey } from '@meeco/cryppo';
import * as Common from '@meeco/file-storage-common';
import { IFileStorageAuthConfiguration } from '@meeco/file-storage-common';
import { expect } from 'chai';
import { fancy } from 'fancy-test';
import { AttachmentService } from '../src/attachment-service';

const mock = require('mock-fs');
const fs = require('fs');

// TODO test delegation token
// TODO test OIDC presence/absence

const fakeVault = 'https://sandbox.meeco.me/vault';
const fakeAuth: IFileStorageAuthConfiguration = {
  vault_access_token: 'vaultToken',
  subscription_key: 'subKey',
};

describe('AttachmentService', () => {
  describe('#download', () => {
    // Mostly implemented by AzureBlockDownload
    fancy
      .stub(Common.AttachmentService.prototype, 'getAttachmentInfo', () => ({
        is_direct_upload: true,
      }))
      .nock(fakeVault, api => {
        api.get(new RegExp('/attachments/badId')).reply(404);
      })
      .add('service', () => new AttachmentService(fakeVault))
      .do(
        async ({ service }) =>
          await service.download({ id: 'badId', key: {} as EncryptionKey, authConfig: fakeAuth })
      )
      .catch('Could not retrieve badId')
      .it('reports a missing id');

    // TODO check args of stubs
    fancy
      .stub(Common.AttachmentService.prototype, 'getAttachmentInfo', () => ({
        is_direct_upload: true,
      }))
      .stub(Common.AttachmentService.prototype, 'getDownloadMetaData', () => ({
        artifactsUrl: '',
        fileInfo: {},
      }))
      .stub(Common.AzureBlockDownload, 'download', async () =>
        cryppo.utf8ToBytes(
          JSON.stringify({
            // TODO: return sth to test block reconstruction
            range: { length: 0 },
          })
        )
      )
      .add('service', () => new AttachmentService(fakeVault))
      .do(
        async ({ service }) =>
          await service.download({ id: 'badId', key: {} as EncryptionKey, authConfig: fakeAuth })
      )
      .it('downloads a file');
  });

  // TODO probably redundant
  describe('#createUploadUrl', () => {
    fancy
      .nock(fakeVault, api => {
        api
          .post('/direct/attachments/upload_url', {
            blob: { filename: 'some_name.txt', content_type: 'plain/text', byte_size: 123 },
          })
          .matchHeader('Authorization', fakeAuth.vault_access_token!)
          .matchHeader('Meeco-Subscription-Key', fakeAuth.subscription_key!)
          .reply(201, { attachment_direct_upload_url: { url: '', blob_id: '', blob_key: '' } });
      })
      .add('service', () => new AttachmentService(fakeVault))
      .do(({ service }) =>
        service.createUploadUrl(
          {
            fileSize: 123,
            fileType: 'plain/text',
            fileName: 'some_name.txt',
          },
          fakeAuth
        )
      )
      .it('calls the API');
  });

  describe('#upload', () => {
    before(() => {
      mock({
        'some/file.txt': 'abcd',
      });
    });

    fancy
      // Note: callback structure of AzureBlockUpload means we can't stub it
      .stub(Common.AttachmentService.prototype, 'uploadBlocks', async () => ({
        artifacts: { a: 1 },
      })) // azure
      .nock(fakeVault, api => {
        // attachment
        api
          .post('/direct/attachments/upload_url', {
            blob: { filename: 'file.txt', content_type: 'text/plain', byte_size: 4 },
          })
          .matchHeader('Authorization', fakeAuth.vault_access_token!)
          .matchHeader('Meeco-Subscription-Key', fakeAuth.subscription_key!)
          .reply(201, { attachment_direct_upload_url: { url: '', blob_id: '', blob_key: '' } });

        // artifacts
        api
          .post('/direct/attachments/upload_url', {
            blob: {
              filename: 'file.txt.encryption_artifacts',
              content_type: 'application/json',
              byte_size: 7,
            },
          })
          .reply(201, { attachment_direct_upload_url: { url: '', blob_id: '', blob_key: '' } });

        // associate
        api.post('/direct/attachments').reply(201, { attachment: {} });
      })
      .add('service', () => new AttachmentService(fakeVault))
      .it('uploads a file', async ({ service }) => {
        await service.upload({
          filePath: 'some/file.txt',
          authConfig: fakeAuth,
          key: ({
            key: 'fake_key',
          } as any) as EncryptionKey,
        });

        // artifacts exist
        expect(fs.readFileSync('file.txt.encryption_artifacts')).to.be.ok;
      });

    fancy
      .do(async () => {
        await new AttachmentService(fakeVault).upload({
          filePath: 'none-file',
          authConfig: fakeAuth,
          key: ({
            key: 'fake_key',
          } as any) as EncryptionKey,
        });
      })
      .catch(/^ENOENT:.*/)
      .it('reports a missing file');
  });
});

// import { ItemService } from '@meeco/sdk';
// import { expect } from '@oclif/test';
// import * as fileUtils from '../../../src/util/file';
// import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

// const singleBluePixel = Buffer.from(
//   'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
//   'base64'
// );

// describe('items:get-attachment', () => {
//   let written;
//   beforeEach(() => {
//     written = false;
//   });

//   customTest
//     .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
//       expect(path).to.eql('out_file.txt');
//       expect(contents).to.eql(singleBluePixel);
//       expect(options).to.eql({
//         flag: 'wx',
//       });
//       written = true;
//       return Promise.resolve();
//     }))
//     .stub(ItemService.prototype, 'downloadAttachment', downloadAttachment as any)
//     .stdout()
//     .stderr()
//     .run([
//       'items:get-attachment',
//       'my_attachment_id',
//       '-o',
//       'out_file.txt',
//       ...testUserAuth,
//       ...testEnvironmentFile,
//     ])
//     .it('downloads, decrypts and saves an attachment to a file', () => {
//       expect(written).to.eql(true);
//     });

//   customTest
//     .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
//       return Promise.reject({
//         code: 'EEXIST',
//       });
//     }))
//     .stub(ItemService.prototype, 'downloadAttachment', downloadAttachment as any)
//     .stdout()
//     .stderr()
//     .run([
//       'items:get-attachment',
//       'my_attachment_id',
//       '-o',
//       'out_file.txt',
//       ...testUserAuth,
//       ...testEnvironmentFile,
//     ])
//     .catch(err =>
//       expect(err.message)
//         .to.contain('The destination file')
//         .and.to.contain('exists')
//     )
//     .it('does not overwrite existing files');

//   customTest
//     .stub(fileUtils, 'writeFileContents', <any>((path, contents, options) => {
//       return Promise.reject({
//         code: 'OTHER',
//       });
//     }))
//     .stub(ItemService.prototype, 'downloadAttachment', downloadAttachment as any)
//     .stdout()
//     .stderr()
//     .run([
//       'items:get-attachment',
//       'my_attachment_id',
//       '-o',
//       'out_file.txt',
//       ...testUserAuth,
//       ...testEnvironmentFile,
//     ])
//     .catch(err => expect(err.message).to.contain('Failed to write to destination file'))
//     .it('handles other file write errors');
// });

// function downloadAttachment(attachmentId, vaultAccessToken, dataEncryptionKey) {
//   return Promise.resolve(singleBluePixel);
// }

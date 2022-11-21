import { EncryptionKey } from '@meeco/cryppo';
import { writeFileSync } from 'fs';
import { AttachmentService } from '../src/attachment-service';

const kateAuth = {
  vault_access_token: '',
  oidc_token: undefined,
  delegation_id: undefined,
  data_encryption_key: EncryptionKey.fromSerialized(''),
  key_encryption_key: EncryptionKey.fromSerialized(''),
  keystore_access_token: '',
  passphrase_derived_key: EncryptionKey.fromSerialized(''),
  secret: '',
};

const meeco = {
  vault: {
    url: 'https://sandbox.meeco.me/vault',
    subscription_key: '24651cc96ff94b1b9751a0a1a5fc3de1',
  },
  keystore: {
    url: 'https://sandbox.meeco.me/keystore',
    subscription_key: '24651cc96ff94b1b9751a0a1a5fc3de1',
  },
};

const upload = async (path: string) => {
  console.log('Uploading', path);

  const uploadedFile = await new AttachmentService(meeco.vault.url).upload({
    filePath: path,
    authConfig: kateAuth,
    key: kateAuth.data_encryption_key,
  });
  console.log('Upload complete', uploadedFile);
  return { uploadedFile };
};

const download = async (path: string, attachmentId: string) => {
  const service = new AttachmentService(meeco.vault.url);
  const { info, data } = await service.download({
    id: attachmentId,
    key: kateAuth.data_encryption_key,
    authConfig: kateAuth,
  });
  console.log(`download file:  ${JSON.stringify(info)}`);
  writeFileSync(path, data);
  console.log('download complete');
};

const main = async () => {
  // const data = readFileSync('./upload/sample-pdf-with-images.pdf');
  // writeFileSync('./download/sample-pdf-with-images.pdf', data);

  // const d3 = await upload('./upload/smallimage.jpg');
  // await download('./download/smallimage.jpg', d3.uploadedFile.id);

  const d4 = await upload('./upload/city.jpg');
  await download('./download/city.jpg', d4.uploadedFile.id);

  // const blocks: any[] = [];

  // blocks.push(await readBlock('./upload/smallimage.jpg', 0, 882805));

  // blocks.push(await readBlock('./upload/sample-pdf-with-images.pdf', 0, 1048576));
  // blocks.push(await readBlock('./upload/sample-pdf-with-images.pdf', 1048576, 2097152));
  // blocks.push(await readBlock('./upload/sample-pdf-with-images.pdf', 2097152, 3145728));
  // blocks.push(await readBlock('./upload/sample-pdf-with-images.pdf', 3145728, 3976877));
  // const byteArray = Buffer.concat(blocks);
  // writeFileSync('./download/sample-pdf-with-images.pdf', byteArray);

  // const b1: any = await readBlock('./upload/video.mp4', 0, 1048576);
  // const b2: any = await readBlock('./upload/video.mp4', 1048576, 2097152);
  // const b3: any = await readBlock('./upload/video.mp4', 2097152, 3114374);
  // // const b4: any = await readBlock('./upload/sample-pdf-with-images.pdf', 3145728, 3976877);

  // const totalBytes = b1.length + b2.length + b3.length;

  // // console.log('blocks length: ' + totalBytes);
  // const byteArray = Buffer.concat([b1, b2, b3], totalBytes);
  // writeFileSync('./download/video.mp4', byteArray);
};

//start
main();

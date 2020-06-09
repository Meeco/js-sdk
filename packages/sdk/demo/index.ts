import {
  AuthData,
  configureFetch,
  EncryptionKey,
  ItemService,
  SecretService,
  UserService
} from '../src/index';
import cryppo from '../src/services/cryppo-service';
import * as environment from './.environment.json';
import './styles.scss';

const $ = document.getElementById.bind(document);
const $get = (id: string) => ($(id) as HTMLInputElement)!.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement)!.value = value);

const STATE: {
  user?: AuthData;
} = {
  user: {
    data_encryption_key: EncryptionKey.fromSerialized(
      '8n4gBhblWtYRLk3rTH1rRGXtKHikTVtJbyTowVtpy1s='
    ),
    key_encryption_key: EncryptionKey.fromSerialized(
      '_jGrW02X_dNw4cSvZZq7XF5ICC1_mHm_f3LIdqtaGno='
    ),
    keystore_access_token:
      'dERNLspexZsg3dspiEXqrSc1Z1QRuiVUlZB6AfU2gA4=.i7J8jYqPwaiwJM67ew_kWiQryVBsK271JmnbqjBg6h4=',
    passphrase_derived_key: EncryptionKey.fromSerialized(
      'qvufd1GAJmiBEKE2FTSksbLbMTBYwh3kucmd78onqoo='
    ),
    secret: '1.bBq6Qp.6ztGfS-hKUdWN-PhnCqi-Fpd4k2-1UMXJz-dWGpGV-yZSzTQ-N',
    vault_access_token: 'bwmDcZsQFBx1S2w4f9wv'
  }
};

// Assumes modern browser with fetch
configureFetch(window.fetch);

// const captcha = readCaptchaTokenFromUrl();
// if (captcha) {
//   $set('captcha', captcha);
// }

// $('getCaptcha').addEventListener('click', () => {
// getCaptchaToken();
// });

$('getUsername').addEventListener('click', getUsername);
$('getSecret').addEventListener('click', getSecret);
$('fetchUserData').addEventListener('click', fetchUserData);
$('createUser').addEventListener('click', createUser);
$('getItems').addEventListener('click', getItems);
$('attachFile').addEventListener('click', attachFile, false);
$('downloadAttachment').addEventListener('click', downloadAttachment);
$('downloadThumbnail').addEventListener('click', downloadThumbnail);

async function getUsername() {
  try {
    const username = await new UserService(environment, log).generateUsername();
    $set('username', username);
  } catch (error) {
    return alert(`Error: ${error.message}`);
  }
}

async function getSecret() {
  clearLog();
  const username = $get('username');
  if (!username) {
    return alert('Generating a secret requires a username');
  }
  const secret = await new SecretService().generateSecret(username);
  $set('secret', secret);
}

async function fetchUserData() {
  clearLog();
  $set('userData', '');
  const passphrase = $get('passphrase');
  const secret = $get('secret');

  if (!passphrase || !secret) {
    return alert('Passphrase and secret are required for fetching user data');
  }

  try {
    const user = await new UserService(environment, log).get(passphrase, secret);
    STATE.user = user;
    $set('userData', JSON.stringify(user, null, 2));
  } catch (error) {
    $set('userData', `Error: ${error.message}`);
  }
}

async function createUser() {
  clearLog();
  $set('userData', '');
  const passphrase = $get('passphrase');
  const secret = $get('secret');

  if (!passphrase || !secret) {
    return alert('Passphrase and secret are required for creating a user');
  }
  try {
    const user = await new UserService(environment, log).create(passphrase, secret);
    STATE.user = user;
    $set('userData', JSON.stringify(user, null, 2));
  } catch (error) {
    $set('userData', `Error: ${error.message}`);
  }
}

async function getItems() {
  clearLog();
  if (!STATE.user) {
    return alert('Fetch user data above before fetching user items');
  }
  $set('items', '');
  try {
    const items = await new ItemService(environment, log).list(STATE.user.vault_access_token);
    $set('items', JSON.stringify(items, null, 2));
  } catch (error) {
    $set('items', `Error: ${error.message}`);
  }
}

async function attachFile() {
  if (!STATE.user) {
    return alert('Please fetch user data above first');
  }

  const [blob] = $('attachment').files;
  if (!blob) {
    return alert('Please attach file first');
  }
  const itemId = $get('itemId');
  if (!itemId) {
    return alert('Please enter an item id');
  }
  $set('attached', '');
  const file: any = await fileAsBinaryString(blob);

  try {
    const attached = await new ItemService(environment, log).attachFile(
      {
        file,
        fileName: 'myfile.png',
        fileType: 'image/png',
        itemId,
        label: 'My File'
      },
      STATE.user
    );
    $set('attached', JSON.stringify(attached, null, 2));
  } catch (error) {
    $set('attached', `Error: ${error.message}`);
  }
}

async function downloadAttachment() {
  if (!STATE.user) {
    return alert('Please fetch user data above first');
  }

  const attachmentId = $get('attachmentId');
  if (!attachmentId) {
    return alert('Please enter attachmentId first');
  }

  $set('downloadAttachmentDetails', '');

  try {
    const itemService = await new ItemService(environment, log);
    const attachment = await itemService.downloadAttachment(
      attachmentId,
      STATE.user.vault_access_token,
      STATE.user.data_encryption_key
    );
    openToDownload(attachment, 'attachment.png', 'image/png');
  } catch (error) {
    $set('downloadAttachmentDetails', `Error ${error.message}`);
  }
}

async function downloadThumbnail() {
  if (!STATE.user) {
    return alert('Please fetch user data above first');
  }

  const thumbnailId = $get('thumbnailId');
  if (!thumbnailId) {
    return alert('Please enter thumbnailId first');
  }

  $set('downloadThumbnailDetails', '');

  try {
    const thumbnail = await new ItemService(environment, log).downloadThumbnail(
      thumbnailId,
      STATE.user.vault_access_token,
      STATE.user.data_encryption_key
    );
    openToDownload(thumbnail, 'thumb.png', 'image/png');
  } catch (error) {
    $set('downloadThumbnailDetails', `Error ${error.message}`);
  }
}

// Todo - cryppo should possibly take care of this under the hood?
function fileAsBinaryString(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      resolve(<any>reader.result);
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function openToDownload(decryptedFileContent: string, fileName: string, contentType: string) {
  const blob = new Blob([cryppo.stringAsBinaryBuffer(decryptedFileContent)], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

function log(message: string) {
  const content = $get('log');
  const newContent = (content ? content + '\n' : '') + message;
  $set('log', newContent);
  $('log').scrollTop = $('log').scrollHeight;
}

function clearLog() {
  $set('log', '');
  $('log').scrollTop = 0;
}

// function getCaptchaToken() {
//   window.location.href = `${environment.keystore.url}/home/captcha_callback_form?redirect_url=${window.location.href}&subscription-key=${environment.keystore.subscription_key}`;
// }

// function readCaptchaTokenFromUrl() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const existing = urlParams.get('g-recaptcha-response');
//   return existing;
// }

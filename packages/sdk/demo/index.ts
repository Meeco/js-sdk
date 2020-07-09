import {
  AuthData,
  configureFetch,
  EncryptionKey,
  Environment,
  ItemService,
  SecretService,
  UserService
} from '../src/index';
import cryppo from '../src/services/cryppo-service';
import './styles.scss';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);

let environment: Environment;
loadEnvironmentFromStorage();

function loadEnvironmentFromStorage() {
  const loadKey = (key: string) =>
    localStorage.getItem(key) ? $set(key, localStorage.getItem(key)!) : void 0;

  loadKey('vaultUrl');
  loadKey('keystoreUrl');
  loadKey('subscriptionKey');

  updateEnvironment();
}

function updateEnvironment() {
  const vaultUrl = $get('vaultUrl');
  const keystoreUrl = $get('keystoreUrl');
  const subscriptionKey = $get('subscriptionKey');

  localStorage.setItem('vaultUrl', vaultUrl);
  localStorage.setItem('keystoreUrl', keystoreUrl);
  localStorage.setItem('subscriptionKey', subscriptionKey);

  if (!vaultUrl || !keystoreUrl || !subscriptionKey) {
    return $set('environmentStatus', 'Error: Please configure all environment fields');
  }

  environment = new Environment({
    vault: {
      url: vaultUrl,
      subscription_key: subscriptionKey
    },
    keystore: {
      url: keystoreUrl,
      subscription_key: subscriptionKey,
      provider_api_key: ''
    }
  });

  $set('environmentStatus', 'Saved');
}

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
$('updateEnvironment').addEventListener('click', updateEnvironment);

async function getUsername() {
  try {
    const username = await new UserService(environment, log).generateUsername();
    $set('username', username);
  } catch (error) {
    $set('username', `Error (See Action Log for Details)`);
    return handleException(error);
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
    $set('userData', `Error (See Action Log for Details)`);
    return handleException(error);
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
    $set('userData', `Error (See Action Log for Details)`);
    return handleException(error);
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
    $set('items', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function attachFile() {
  if (!STATE.user) {
    return alert('Please fetch user data above first');
  }

  const [blob] = ($('attachment') as any).files;
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
    $set('attached', `Error (See Action Log for Details)`);
    return handleException(error);
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
    $set('downloadAttachmentDetails', `Error (See Action Log for Details)`);
    return handleException(error);
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
    $set('downloadThumbnailDetails', `Error (See Action Log for Details)`);
    return handleException(error);
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

async function handleException(error) {
  let errorMessage: string;
  if (error && error.json && typeof error.json === 'function') {
    error = await error.json();
  }
  if (error.message) {
    errorMessage = error.message;
  } else {
    errorMessage = error;
  }
  log(errorMessage);
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

import { fileDownloadBrowser, fileUploadBrowser } from '../src/index';
import './styles.scss';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);

// let environment;

loadEnvironmentFromStorage();

function loadEnvironmentFromStorage() {
  const loadKey = (key: string) =>
    localStorage.getItem(key) ? $set(key, localStorage.getItem(key)!) : void 0;

  loadKey('vaultUrl');
  loadKey('dataEncryptionKey');
  loadKey('subscriptionKey');

  updateEnvironment();
}

function updateEnvironment() {
  const vaultUrl = $get('vaultUrl');
  const dataEncryptionKey = $get('dataEncryptionKey');
  const subscriptionKey = $get('subscriptionKey');
  const vaultAccessToken = $get('vaultAccessToken');

  localStorage.setItem('vaultUrl', vaultUrl);
  localStorage.setItem('dataEncryptionKey', dataEncryptionKey);
  localStorage.setItem('subscriptionKey', subscriptionKey);
  localStorage.setItem('vaultAccessToken', vaultAccessToken);

  if (!vaultUrl || !dataEncryptionKey) {
    return $set('environmentStatus', 'Error: Please configure all environment fields');
  }

  $set('environmentStatus', 'Saved');
}

$('attachFile').addEventListener('click', attachFile, false);
$('downloadAttachment').addEventListener('click', downloadAttachment);

async function attachFile() {
  const [file] = ($('attachment') as any).files;
  if (!file) {
    return alert('Please attach file first');
  }
  const itemId = $get('itemId');
  if (!itemId) {
    return alert('Please enter an item id');
  }
  $set('attached', '');
  // const file: any = await fileAsBinaryString(blob);

  try {
    const attached = await fileUploadBrowser(
      file,
      localStorage.getItem('dataEncryptionKey') || '',
      localStorage.getItem('vaultUrl') || '',
      localStorage.getItem('vaultAccessToken') || '',
      localStorage.getItem('subscriptionKey') || ''
    );

    $set('attached', JSON.stringify(attached, null, 2));
  } catch (error) {
    $set('attached', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function downloadAttachment() {
  const attachmentId = $get('attachmentId');
  if (!attachmentId) {
    return alert('Please enter attachmentId first');
  }
  $set('downloadAttachmentDetails', '');

  try {
    const downloadedFile = await fileDownloadBrowser(
      attachmentId,
      localStorage.getItem('dataEncryptionKey') || '',
      localStorage.getItem('vaultUrl') || '',
      localStorage.getItem('vaultAccessToken') || '',
      localStorage.getItem('subscriptionKey') || ''
    );
    const fileUrl = URL.createObjectURL(downloadedFile);

    // add download button, click it then remove it
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = downloadedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    $set('downloadAttachmentDetails', `Error (See Action Log for Details)`);
    return handleException(error);
  }
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

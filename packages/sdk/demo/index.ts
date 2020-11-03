import {
  AuthData,
  configureFetch,
  Environment,
  ItemService,
  NewItem,
  SDKTemplate,
  Secrets,
  TemplateService,
  UserService,
} from '../src/index';
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
      subscription_key: subscriptionKey,
    },
    keystore: {
      url: keystoreUrl,
      subscription_key: subscriptionKey,
      provider_api_key: '',
    },
  });

  $set('environmentStatus', 'Saved');
}

const STATE: {
  user?: AuthData;
} = {};

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
$('getTemplates').addEventListener('click', getTemplates);
$('updateEnvironment').addEventListener('click', updateEnvironment);
$('createItem').addEventListener('click', createItem);

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
  const secret = Secrets.generateSecret(username);
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
    const user = await new UserService(environment, log).getAuthData(passphrase, secret);
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
    const items = await new ItemService(environment, log).list(STATE.user);
    $set('items', JSON.stringify(items, null, 2));
  } catch (error) {
    $set('items', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function getTemplates() {
  clearLog();
  if (!STATE.user) {
    return alert('Fetch user data above before fetching templates');
  }
  $set('templates', '');
  try {
    const templates = await new TemplateService(environment, log).list(STATE.user);
    $set('templates', JSON.stringify(templates, null, 2));

    // seed template selector
    const options = templates.item_templates
      .map(t => `<option value="${t.name}">${t.label}</option>`)
      .join('');
    $('templateSelect').innerHTML = options;

    const templateSelectHandler = () => {
      const templateName = $get('templateSelect');
      const sdkTemplate = new SDKTemplate(
        templates.item_templates.find(t => t.name === templateName)!,
        templates.slots
      );
      const slotHTML = sdkTemplate.slots
        .map(
          s =>
            `<label>${s.label}</label><input name="${s.name}" type="${slotTypeToInputType(
              s.slot_type_name
            )}">`
        )
        .join('');
      $('formSlots').innerHTML = slotHTML;
    };

    // seed new item slots on select
    $('templateSelect').addEventListener('change', templateSelectHandler);

    // initialize slots with the first selection
    templateSelectHandler();
  } catch (error) {
    $set('templates', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

async function createItem() {
  clearLog();
  if (!STATE.user) {
    return alert('Fetch user data above first');
  }
  $set('newItem', '');
  try {
    // get field values
    const label = $get('labelField');
    const templateName = $get('templateSelect');
    // construct Item with slot values
    const item = new NewItem(label, templateName, readItemSlots());
    const newItem = await new ItemService(environment, log).create(STATE.user, item);
    $set('newItem', JSON.stringify(newItem, null, 2));
  } catch (error) {
    $set('newItem', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}

function readItemSlots(): Array<{ name: string; value: string }> {
  const result: any[] = [];
  $('formSlots')
    .querySelectorAll('input')
    .forEach((input: any) => result.push({ name: input.name, value: input.value }));
  return result;
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

function slotTypeToInputType(ty: string): string {
  switch (ty) {
    case 'bool':
      return 'checkbox';
    case 'date':
    case 'datetime':
      return 'date';
    case 'password':
      return 'password';
    case 'phone_number':
      return 'number';
    case 'key_value':
    default:
      return 'text';
  }
}

// function getCaptchaToken() {
//   window.location.href = `${environment.keystore.url}/home/captcha_callback_form?redirect_url=${window.location.href}&subscription-key=${environment.keystore.subscription_key}`;
// }

// function readCaptchaTokenFromUrl() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const existing = urlParams.get('g-recaptcha-response');
//   return existing;
// }

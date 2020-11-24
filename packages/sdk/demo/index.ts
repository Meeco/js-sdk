import { Share } from '@meeco/vault-api-sdk';
import m = require('mithril'); // prevents a weird compilation error
import {
  AcceptanceRequest,
  AuthData,
  configureFetch,
  ConnectionService,
  DecryptedItem,
  Environment,
  ItemService,
  NewItem,
  NewSlot,
  SDKTemplate,
  Secrets,
  ShareService,
  SharingMode,
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
    log('Error: Please configure all environment fields');
    return;
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

  log('Saved environment settings');
}

const STATE: {
  user?: AuthData;
  otherUsers: AuthData[];
  templates: SDKTemplate[];
  connections: Array<{ id: string; name: string }>;
} = { otherUsers: [], templates: [], connections: [] };

// Assumes modern browser with fetch
configureFetch(window.fetch);

// const captcha = readCaptchaTokenFromUrl();
// if (captcha) {
//   $set('captcha', captcha);
// }

// $('getCaptcha').addEventListener('click', () => {
// getCaptchaToken();
// });

// $('getUsername').addEventListener('click', getUsername);
// $('getSecret').addEventListener('click', getSecret);
// $('fetchUserData').addEventListener('click', fetchUserData);
// $('createUser').addEventListener('click', createUser);
// $('getItems').addEventListener('click', getItems);
// $('getTemplates').addEventListener('click', getTemplates);
$('updateEnvironment').addEventListener('click', updateEnvironment);
// $('createItem').addEventListener('click', createItem);

m.mount(
  document.getElementById('user1')!,
  UserComponent({
    // show item create after login
    onlogin: auth => {
      STATE.user = auth;
      getTemplates();
      m.mount(
        document.getElementById('item')!,
        CreateItemComponent({
          // show existing item after creating it
          oncreated: item =>
            m.mount(document.getElementById('item')!, ExistingItemComponent({ item })),
        })
      );
    },
  })
);

m.mount(
  document.getElementById('user2')!,
  UserComponent({
    onlogin: auth => STATE.otherUsers.push(auth),
  })
);
m.mount(
  document.getElementById('user3-col')!,
  UserComponent({
    onlogin: auth => STATE.otherUsers.push(auth),
  })
);

m.mount(document.getElementById('share2')!, AcceptShareComponent);

/*
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
} */
/*
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
*/
async function getTemplates() {
  clearLog();
  if (!STATE.user) {
    return alert('Fetch user data above before fetching templates');
  }
  // $set('templates', '');
  try {
    const templates = await new TemplateService(environment, log).list(STATE.user);
    // $set('templates', JSON.stringify(templates, null, 2));

    // note that SDKtemplate constructor filters the correct slots from the response
    STATE.templates = templates.item_templates.map(t => new SDKTemplate(t, templates.slots));
    m.redraw();
    // seed template selector
    // const options = templates.item_templates
    //   .map(t => `<option value="${t.name}">${t.label}</option>`)
    //   .join('');
    // $('templateSelect').innerHTML = options;

    // const templateSelectHandler = () => {
    //   const templateName = $get('templateSelect');
    //   const sdkTemplate = new SDKTemplate(
    //     templates.item_templates.find(t => t.name === templateName)!,
    //     templates.slots
    //   );
    //   const slotHTML = sdkTemplate.slots
    //     .map(
    //       s =>
    //         `<label>${s.label}</label><input name="${s.name}" type="${slotTypeToInputType(
    //           s.slot_type_name
    //         )}">`
    //     )
    //     .join('');
    //   $('formSlots').innerHTML = slotHTML;
    // };

    // seed new item slots on select
    // $('templateSelect').addEventListener('change', templateSelectHandler);

    // initialize slots with the first selection
    // templateSelectHandler();
  } catch (error) {
    // $set('templates', `Error (See Action Log for Details)`);
    return handleException(error);
  }
}
/*
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
    // $set('newItem', JSON.stringify(newItem, null, 2));
    $set('newItem', JSON.stringify(newItem.values, null, 2));
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
*/

// Connect all users together, assume max 3
async function connectAll() {
  const service = new ConnectionService(environment, log);
  let count = 1;
  for (const user of STATE.otherUsers) {
    const { fromUserConnection } = await service.createConnection({
      from: STATE.user!,
      to: user,
      options: { fromName: 'any', toName: 'any' },
    });
    STATE.connections.push({ name: `user${count}`, id: fromUserConnection.own.id });
    count += 1;
  }

  if (STATE.otherUsers.length > 1) {
    service.createConnection({
      from: STATE.otherUsers[0],
      to: STATE.otherUsers[1],
      options: { fromName: 'any', toName: 'any' },
    });
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

function UserComponent(vInit) {
  let username = '';
  let secret = '';
  let passphrase = '';
  let user: AuthData;

  const loginCallback: (_: AuthData) => void = vInit.onlogin;

  async function _getUsername() {
    try {
      username = await new UserService(environment, log).generateUsername();
      m.redraw();
    } catch (error) {
      return handleException(error);
    }
  }

  function _getSecret() {
    clearLog();
    if (!username) {
      return alert('Generating a secret requires a username');
    }
    secret = Secrets.generateSecret(username);
  }

  async function _fetchUserData() {
    clearLog();
    if (!passphrase || !secret) {
      return alert('Passphrase and secret are required for fetching user data');
    }

    try {
      user = await new UserService(environment, log).getAuthData(passphrase, secret);
      loginCallback(user);
      m.redraw();
    } catch (error) {
      return handleException(error);
    }
  }

  async function _createUser() {
    clearLog();
    if (!passphrase || !secret) {
      return alert('Passphrase and secret are required for creating a user');
    }
    try {
      user = await new UserService(environment, log).create(passphrase, secret);
      loginCallback(user);
      m.redraw();
    } catch (error) {
      return handleException(error);
    }
  }

  return {
    view: vnode =>
      m('.card', [
        m('h4', 'User Login'),
        m('hr'),
        m('input', {
          placeholder: 'Enter or Generate Username',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: username,
          onchange: e => (username = e.target.value),
        }),
        m('button', { onclick: _getUsername }, 'Generate'),
        m('input', {
          placeholder: 'Enter or Generate User Secret',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: secret,
          onchange: e => (secret = e.target.value),
        }),
        m('button', { onclick: _getSecret }, 'Generate'),
        m('input', {
          placeholder: 'Enter Passphrase',
          type: 'password',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: passphrase,
          onchange: e => (passphrase = e.target.value),
        }),
        m('hr'),
        m('button', { onclick: _fetchUserData }, 'Fetch User Data'),
        m('button', { onclick: _createUser }, 'Create New User'),
        m('button', { disabled: !STATE.otherUsers.length, onclick: connectAll }, 'Connect Users'),
        m('textarea', { disabled: true, rows: 10, value: user && JSON.stringify(user, null, 2) }),
      ]),
  };
}

/**
 * Use this like m(SlotComponent, { slot: aSlot }), as the slot is updated with
 * the user's entered value.
 */
function SlotComponent() {
  return {
    view: vNode =>
      m('div', [
        m('label', vNode.attrs.slot.label),
        m('input', {
          name: vNode.attrs.slot.name,
          type: slotTypeToInputType(vNode.attrs.slot.slot_type_name),
          value: vNode.attrs.slot.value || '',
          onchange: e => (vNode.attrs.slot.value = e.target.value),
        }),
      ]),
  };
}

function CreateItemComponent(vInit) {
  let itemTemplate: SDKTemplate;
  let itemLabel = '';
  // store the state of the form inputs
  let newSlots: NewSlot[] = [];
  const createdCallback: (_: DecryptedItem) => void = vInit.oncreated;

  function changeTemplate(e) {
    itemTemplate = STATE.templates.find(t => t.name === e.target.value)!;
    // refresh state of newSlots
    newSlots = itemTemplate.slots.map(({ label, slot_type_name }) => ({
      label,
      slot_type_name,
    }));
  }

  async function _createItem() {
    clearLog();
    if (!STATE.user) {
      return alert('Fetch user data above first');
    }
    try {
      // construct Item with slot values
      const item = new NewItem(itemLabel, itemTemplate.name, newSlots);
      const newItem = await new ItemService(environment, log).create(STATE.user, item);
      createdCallback(newItem);
      m.redraw();
    } catch (error) {
      return handleException(error);
    }
  }

  return {
    view: vNode =>
      m('.card', [
        m('h4', 'Create Item'),
        m('hr'),
        m('form', [
          m('input', { type: 'button', value: 'Create', onclick: _createItem }),
          m('input', { type: 'reset', value: 'Reset' }),
          m('div', [
            m('label', 'Template'),
            m(
              'select',
              { onchange: changeTemplate },
              STATE.templates.map(t => m('option', { value: t.name }, t.label))
            ),
          ]),
          m('div', [
            m('label', 'Label'),
            m('input', {
              name: 'label',
              required: true,
              value: itemLabel,
              onchange: e => (itemLabel = e.target.value),
            }),
          ]),
          m(
            'div',
            newSlots.map(s => m(SlotComponent, { slot: s }))
          ),
        ]),
      ]),
  };
}

function ExistingItemComponent(vInit) {
  const item: DecryptedItem = vInit.item || {};

  return {
    view: vNode =>
      m('.card', [
        m('h4', 'Item'),
        m('hr'),
        m('form', [
          m('input', { type: 'button', value: 'Edit' }),
          m('input', { type: 'button', value: 'Delete' }),

          // m('input', { type: 'reset', value: 'Reset' }),
          m('div', [
            m('label', 'Template'),
            m('input', { disabled: true, value: item.item.item_template_label }),
            m('label', 'Label'),
            m('input', { name: 'label', value: item.label }),
          ]),
          m(
            'div',
            item.slots.map(s => m(SlotComponent, { slot: s }))
          ),
        ]),
        m('textarea', { disabled: true, rows: '10', value: JSON.stringify(item, null, 2) }),
        m(CreateShareComponent(vInit)),
      ]),
  };
}

function CreateShareComponent(vInit) {
  let expiry = '';
  const canOnshare = false;
  const mustAcceptTerms = false;
  let terms = '';
  const item: DecryptedItem = vInit.item;
  let connectionId = '';
  const callback: (_: Share) => void = vInit.onshare;

  async function createShare() {
    clearLog();
    const service = new ShareService(environment, log);
    const {
      shares: [share],
    } = await service.shareItem(STATE.user!, connectionId, item.id, {
      expires_at: expiry ? new Date(expiry) : undefined,
      terms,
      sharing_mode: canOnshare ? SharingMode.anyone : SharingMode.owner,
      acceptance_required: mustAcceptTerms
        ? AcceptanceRequest.Required
        : AcceptanceRequest.NotRequired,
    });
    callback(share);
  }

  return {
    view: vNode => [
      m('h4', 'Sharing'),
      m('hr'),
      m('input', { type: 'button', value: 'Share', onclick: createShare }),
      m('div', [
        m('label', 'Share with:'),
        m(
          'select',
          { onchange: e => (connectionId = e.target.value) },
          STATE.connections.map(({ name, id }) => m('option', { value: id }, name))
        ),
      ]),
      m('div', [
        m('label', 'Expiry'),
        m('input', { type: 'date', value: expiry, onchange: e => (expiry = e.target.value) }),
      ]),
      m('div', [
        m('label', 'Allow on-sharing:'),
        m('input', { type: 'checkbox', checked: canOnshare }),
      ]),
      m('div', [
        m('label', 'Receiver must accept terms:'),
        m('input', { type: 'checkbox', checked: mustAcceptTerms }),
      ]),
      m('div', [
        m('label', 'Terms:'),
        m('textarea', { rows: '10', value: terms, onchange: e => (terms = e.target.value) }),
      ]),
    ],
  };
}

function AcceptShareComponent(vInit) {
  return {
    view: vNode =>
      m('.card', [
        m('h4', 'Incoming Share'),
        m('hr'),
        m('input', { type: 'button', value: 'Accept' }),
        m('input', { type: 'button', value: 'Reject' }),
        m('div', [m('label', 'Item Label'), m('input', { disabled: true, value: '' })]),
        m('div', [m('label', 'Item Template'), m('input', { disabled: true, value: '' })]),
        m('div', [m('label', 'Expiry'), m('input', { type: 'date' })]),
        m('div', [m('label', 'Terms:'), m('textarea', { rows: '10' })]),
        m('div', [
          m('label', 'Owner:'),
          m('input', { disabled: true, value: '' }),
          m('label', 'Sender:'),
          m('input', { disabled: true, value: '' }),
        ]),
      ]),
  };
}

/*
function ReceivedItemComponent() {
  return {
    view: vNode =>
      m('.card', [
        m('h4', 'Shared Item'),
        m('hr'),
        m('form', [
          m('input#createItem', { type: 'button', value: 'Create' }),
          m('input', { type: 'reset', value: 'Reset' }),
          m('div', [
            m('label', { for: 'templateSelect' }, 'Template'),
            m('select', { id: 'templateSelect', name: 'template_name' }),
          ]),
          m('div', [
            m('label', { for: 'labelField' }, 'Label'),
            m('input', { name: 'label', id: 'labelField', required: true }),
          ]),
          m('div#formSlots'),
        ]),
        m('textarea', { disabled: true, id: 'newItem', rows: '10' }),
      ]),
  };
}
*/

import m = require('mithril'); // prevents a weird compilation error

import {
  AcceptanceRequest,
  AcceptanceStatus,
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
  ShareType,
  TemplateService,
  UserService,
} from '@meeco/sdk';
import { Share, ShareAcceptanceRequiredEnum } from '@meeco/vault-api-sdk';

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
  // username to array of <connectionId, username>
  connections: Record<string, { connectionId: string; name: string }[]>;
} = { otherUsers: [], templates: [], connections: {} };

// Assumes modern browser with fetch
configureFetch(window.fetch);

$('updateEnvironment').addEventListener('click', updateEnvironment);

m.mount($('app-main'), AppComponent);

function getUsername(auth: AuthData): string {
  return Secrets.usernameFromSecret(auth.secret);
}

async function getTemplates(auth: AuthData): Promise<SDKTemplate[]> {
  clearLog();
  try {
    const templates = await new TemplateService(environment, log).list(auth);

    // note that SDKtemplate constructor filters the correct slots from the response
    return templates.item_templates.map(t => new SDKTemplate(t, templates.slots));
  } catch (error: any) {
    log(error.message || error);
    throw error;
  }
}

// connect the given user to all other users
// checks to ensure no self connections
async function connect(fromUser: AuthData) {
  const service = new ConnectionService(environment, log);
  const fromUsername = getUsername(fromUser);

  // init
  if (!STATE.connections[fromUsername]) {
    STATE.connections[fromUsername] = [];
  }

  for (const user of STATE.otherUsers.concat(STATE.user!)) {
    if (fromUser.secret !== user.secret) {
      const toUsername = getUsername(user);
      log(`Connecting ${fromUsername} to ${toUsername}`);
      // init
      if (!STATE.connections[toUsername]) {
        STATE.connections[toUsername] = [];
      }

      const { fromUserConnection, toUserConnection } = await service.createConnection({
        from: fromUser,
        to: user,
        options: { fromName: 'any', toName: 'any' },
      });

      STATE.connections[fromUsername].push({
        name: toUsername,
        connectionId: fromUserConnection.own.id,
      });
      STATE.connections[toUsername].push({
        name: fromUsername,
        connectionId: toUserConnection.own.id,
      });
    }
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

// tslint:disable-next-line:interface-over-type-literal
type UserState = {
  username: string;
  item: DecryptedItem | null;
  share: Share | null;
  auth: AuthData;
};

function AppComponent() {
  // this is passed to the user's components
  const userState: UserState[] = [];

  function getStateFor(username: string): UserState {
    const result = userState.find(x => x.username === username);
    if (!result) {
      throw new Error(`Reference to non-existing username ${username}`);
    }
    return result;
  }

  let mainItem;
  const user1 = UserComponent({
    onlogin: async auth => {
      STATE.user = auth;
      userState[0] = {
        username: getUsername(auth),
        item: null,
        share: null,
        auth,
      };
      STATE.templates = await getTemplates(auth);
      mainItem = CreateItemComponent({ oncreated: _showExistingItem });
      m.redraw();
    },
  });

  let user2ItemComponent;
  const user2 = UserComponent({
    onlogin: auth => {
      STATE.otherUsers.push(auth);
      userState[1] = {
        username: getUsername(auth),
        item: null,
        share: null,
        auth,
      };
      user2ItemComponent = SharedItemComponent({ auth, onshare: _showAcceptShare });
      return connect(auth);
    },
  });

  let user3ItemComponent;
  const user3 = UserComponent({
    onlogin: auth => {
      STATE.otherUsers.push(auth);
      userState[2] = {
        username: getUsername(auth),
        item: null,
        share: null,
        auth,
      };
      user3ItemComponent = SharedItemComponent({ auth, onshare: _showAcceptShare });
      return connect(auth);
    },
  });

  // actions
  // An item is created by user1
  const _showExistingItem = (item: DecryptedItem) => {
    userState[0].item = item;
    mainItem = ExistingItemComponent({
      onshare: _showAcceptShare,
      auth: STATE.user!,
    });
  };

  // user 0 created a share with user 1 or 2, now show the share for the user to accept terms
  const _showAcceptShare = async (share: Share, receiver: string) => {
    const username = receiver;
    const state = getStateFor(username);

    try {
      const response = await new ShareService(environment, log)
        .getAPI(state.auth)
        .incomingSharesIdGet(share.id);

      state.share = response.share;

      // get the item if acceptance is not required
      if (
        response.share.acceptance_required === ShareAcceptanceRequiredEnum.AcceptanceNotRequired
      ) {
        const { item } = await new ShareService(environment, log).getSharedItem(
          state.auth,
          share.id,
          ShareType.Incoming
        );

        state.item = item;
      }
    } catch (error: any) {
      log(error.message || error);
      throw error;
    }
    m.redraw();
  };

  return {
    view: vnode => [
      m('div', [m(user1), mainItem ? m(mainItem, { item: userState[0].item }) : null]),
      m('div', [
        m(user2),
        userState[1]?.share ? m(user2ItemComponent, { userState: userState[1] }) : null,
      ]),
      m('div', [
        m(user3),
        userState[2]?.share ? m(user3ItemComponent, { userState: userState[2] }) : null,
      ]),
    ],
  };
}

/** Simple component for styling headers */
function CardComponent() {
  return {
    view: vnode => m('.card', [m('h4', vnode.attrs.title), m('hr'), vnode.children]),
  };
}

function UserComponent(vInit: { onlogin: (_: AuthData) => void }) {
  let username = '';
  let secret = '';
  let passphrase = '';
  let user: AuthData;
  let title = 'User Login';

  function onlogin(auth: AuthData) {
    username = username || Secrets.usernameFromSecret(secret);
    title = 'User ' + username;
    vInit.onlogin(auth);
    m.redraw();
  }

  async function generateUsername() {
    try {
      username = await new UserService(environment, log).generateUsername();
      m.redraw();
    } catch (error) {
      return handleException(error);
    }
  }

  function generateSecret() {
    clearLog();
    if (!username) {
      return alert('Generating a secret requires a username');
    }
    secret = Secrets.generateSecret(username);
  }

  async function fetchUserData() {
    clearLog();
    if (!passphrase || !secret) {
      return alert('Passphrase and secret are required for fetching user data');
    }

    try {
      user = await new UserService(environment, log).getAuthData(passphrase, secret);
      onlogin(user);
    } catch (error) {
      return handleException(error);
    }
  }

  async function createUser() {
    clearLog();
    if (!secret) {
      if (!username) {
        await generateUsername();
      }
      generateSecret();
    }
    if (!passphrase) {
      return alert('Passphrase is required for creating a user');
    }
    try {
      user = await new UserService(environment, log).create(passphrase, secret);
      onlogin(user);
    } catch (error) {
      return handleException(error);
    }
  }

  return {
    view: () =>
      m(CardComponent, { title }, [
        m('input', {
          placeholder: 'Enter or Generate Username',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: username,
          onchange: e => (username = e.target.value),
        }),
        m('button', { onclick: generateUsername }, 'Generate'),
        m('input', {
          placeholder: 'Enter or Generate User Secret',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: secret,
          onchange: e => (secret = e.target.value),
        }),
        m('button', { onclick: generateSecret, disabled: !username }, 'Generate'),
        m('input', {
          placeholder: 'Enter Passphrase',
          type: 'password',
          autocapitalize: 'off',
          autocomplete: 'off',
          value: passphrase,
          required: true,
          onchange: e => (passphrase = e.target.value),
        }),
        m('hr'),
        m(
          'button',
          { onclick: fetchUserData, disabled: !(passphrase && secret) },
          'Fetch User Data'
        ),
        m('button', { onclick: createUser }, 'Create New User'),
        user
          ? m('textarea', { disabled: true, rows: 10, value: JSON.stringify(user, null, 2) })
          : null,
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

/** Used by the primary user to create an Item from a Template */
function CreateItemComponent(vInit: { oncreated: (_: DecryptedItem) => void }) {
  let itemTemplate: SDKTemplate;
  let itemLabel = '';
  // store the state of the form inputs
  let newSlots: NewSlot[] = [];
  const createdCallback = vInit.oncreated;

  function changeTemplate(e) {
    itemTemplate = STATE.templates.find(t => t.name === e.target.value)!;
    // refresh state of newSlots
    newSlots = itemTemplate.slots.map(({ name, label, slot_type_name }) => ({
      name,
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
      m(CardComponent, { title: 'Create Item' }, [
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

/**
 * Either an AcceptShareComponent or ExistingItemComponent depending on userState.
 * Attrs: userState
 */
function SharedItemComponent(vInit: {
  auth: AuthData;
  onshare: (_: Share, receiver: string) => void;
}) {
  const acceptComponent = AcceptShareComponent({
    onaccept: () => {
      m.redraw();
    },
    onreject: () => {
      m.redraw();
    },
  });

  const itemComponent = ExistingItemComponent({
    auth: vInit.auth,
    onshare: vInit.onshare,
  });

  return {
    view: vnode =>
      vnode.attrs.userState.share.acceptance_required === AcceptanceStatus.Required
        ? m(acceptComponent, { userState: vnode.attrs.userState })
        : m(itemComponent, { item: vnode.attrs.userState.item }),
  };
}

/**
 * An Item that has be created or received via share.
 * Attrs: item, share
 */
function ExistingItemComponent(vInit: {
  auth: AuthData;
  onshare: (_: Share, receiver: string) => void;
}) {
  const shareComponent = CreateShareComponent(vInit);

  return {
    view: vnode =>
      m(CardComponent, { title: 'Item' }, [
        m('form', [
          vnode.attrs.item.isOwned()
            ? m('input', { type: 'button', value: 'Edit', onclick: () => alert('TODO') })
            : null,
          m('input', { type: 'button', value: 'Delete', onclick: () => alert('TODO') }),

          m('div', [
            m('label', 'Template'),
            m('input', { disabled: true, value: vnode.attrs.item.item.item_template_label }),
            m('label', 'Label'),
            m('input', { name: 'label', value: vnode.attrs.item.label }),
          ]),
          m(
            'div',
            vnode.attrs.item.slots.map(s => m(SlotComponent, { slot: s }))
          ),
        ]),
        m('textarea', {
          disabled: true,
          rows: '10',
          value: JSON.stringify(vnode.attrs.item, null, 2),
        }),
        // only if we can onshare
        vnode.attrs.item.isOwned || vnode.attrs.share?.onsharing_permitted === true
          ? m(shareComponent, { item: vnode.attrs.item })
          : null,
      ]),
  };
}

/**
 * attrs: item: DecryptedItem
 */
function CreateShareComponent(vInit: {
  auth: AuthData;
  onshare: (_: Share, receiver: string) => void;
}) {
  let expiry = '';
  let canOnshare = false;
  let mustAcceptTerms = false;
  let terms = '';
  const ownerName = getUsername(vInit.auth);
  const ownerAuth = vInit.auth;
  let connectionId = '';

  const callback = vInit.onshare;

  async function createShare(item: DecryptedItem) {
    clearLog();
    const service = new ShareService(environment, log);
    // connectionId may be unset if users were created after the item
    const connectionValue = connectionId || $get('connection-select');
    const receiverUsername = STATE.connections[ownerName].find(
      x => x.connectionId === connectionValue
    )!.name;

    if (!connectionValue) {
      alert('No connection selected for share');
      return;
    }

    try {
      const shareOptions = {
        expires_at: expiry ? new Date(expiry) : undefined,
        terms,
        onsharing_permitted: canOnshare,
        acceptance_required: mustAcceptTerms
          ? AcceptanceRequest.Required
          : AcceptanceRequest.NotRequired,
      };

      // this API endpoint lets us create multiple shares, but we only create one
      const {
        shares: [share],
      } = await service.shareItem(ownerAuth, connectionValue, item.id, shareOptions);

      callback(share, receiverUsername);
    } catch (error: any) {
      log(error.message || error);
      throw error;
    }
  }

  return {
    view: vnode => [
      m('h4', 'Sharing'),
      m('hr'),
      m('input', { type: 'button', value: 'Share', onclick: () => createShare(vnode.attrs.item) }),

      m('div', [
        m('label', 'Share with:'),
        m(
          'select#connection-select',
          { onchange: e => (connectionId = e.target.value) },
          (STATE.connections[ownerName] || []).map(({ name, connectionId: id }) =>
            m('option', { value: id }, name)
          )
        ),
      ]),
      m('div', [
        m('label', 'Expiry'),
        m('input', {
          type: 'date',
          required: true,
          value: expiry,
          onchange: e => (expiry = e.target.value),
        }),
      ]),
      m('div', [
        m('label', 'Allow on-sharing:'),
        m('input', {
          type: 'checkbox',
          checked: canOnshare,
          onchange: e => (canOnshare = e.target.value),
        }),
      ]),
      m('div', [
        m('label', 'Receiver must accept terms:'),
        m('input', {
          type: 'checkbox',
          checked: mustAcceptTerms,
          onchange: e => (mustAcceptTerms = e.target.value),
        }),
      ]),
      m('div', [
        m('label', 'Terms:'),
        m('textarea', { rows: '10', value: terms, onchange: e => (terms = e.target.value) }),
      ]),
    ],
  };
}

/**
 * Shows terms if applicable, user may accept or reject.
 * Attrs: userstate
 */
function AcceptShareComponent(vInit: {
  onaccept: (item: DecryptedItem, share: Share) => void;
  onreject: () => void;
}) {
  const acceptCallback = vInit.onaccept;
  const rejectCallback = vInit.onreject;

  async function acceptShare(userState: UserState) {
    clearLog();
    const service = new ShareService(environment, log);
    const shareId = userState.share!.id;

    try {
      // cannot use this API method if acceptance is not required
      if (userState.share!.acceptance_required === ShareAcceptanceRequiredEnum.AcceptanceRequired) {
        await service.acceptIncomingShare(userState.auth, shareId);
      }

      // update user state
      const { share, item } = await service.getSharedItem(userState.auth, shareId);
      userState.share = share;
      userState.item = item;
      acceptCallback(item, share);
    } catch (error: any) {
      log(error.message || error);
      throw error;
    }
  }

  function rejectShare(userState: UserState) {
    userState.item = null;
    userState.share = null;
    rejectCallback();
  }

  return {
    view: vnode =>
      m(CardComponent, { title: 'Incoming Share' }, [
        m('input', {
          type: 'button',
          value: 'Accept',
          onclick: () => acceptShare(vnode.attrs.userState),
        }),
        m('input', {
          type: 'button',
          value: 'Reject',
          onclick: () => rejectShare(vnode.attrs.userState),
        }),

        m('div', [
          m('label', 'Expiry'),
          m('input', {
            type: 'date',
            // expires_at is a Date object
            value: vnode.attrs.userState.share.expires_at.toISOString().slice(0, 10),
          }),
        ]),

        vnode.attrs.userState.share.terms
          ? m('div', [
              m('label', 'Terms:'),
              m('textarea', { rows: '10', value: vnode.attrs.userState.share.terms }),
            ])
          : null,

        m('div', [
          m('label', 'Owner:'),
          m('input', { disabled: true, value: vnode.attrs.userState.share.owner_id }),
          m('label', 'Sender:'),
          m('input', { disabled: true, value: vnode.attrs.userState.share.sender_id }),
        ]),
      ]),
  };
}

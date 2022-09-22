import {
  configureFetch,
  DIDBase,
  DIDKey,
  DIDManagementService,
  DIDSov,
  DIDWeb,
  Ed25519,
  Environment,
} from '@meeco/sdk';
import JSONFormatter from 'json-formatter-js';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);
let resolvedDidResult: string = '';
let createdDidResult: string = '';
let deativateDIDResult: string = '';

$('copyResolveDID').setAttribute('disabled', 'true');
$('copyCreateDID').setAttribute('disabled', 'true');
$('copyDeativateDID').setAttribute('disabled', 'true');

const options = [
  {
    name: 'sov',
    label: 'sov',
  },
  {
    name: 'key',
    label: 'key',
  },
  {
    name: 'web',
    label: 'web',
  },
]
  .map(t => `<option value="${t.name}">${t.label}</option>`)
  .join('');
$('DIDSelect').innerHTML = options;
$('DIDSelectDeactivate').innerHTML = options;

let environment: Environment;
loadEnvironmentFromStorage();

function loadEnvironmentFromStorage() {
  const loadKey = (key: string) =>
    localStorage.getItem(key) ? $set(key, localStorage.getItem(key)!) : void 0;

  loadKey('identityNetworkUrl');
  loadKey('subscriptionKey');

  updateEnvironment();
}

function updateEnvironment() {
  const identityNetworkUrl = $get('identityNetworkUrl');
  const subscriptionKey = $get('subscriptionKey');

  localStorage.setItem('identityNetworkUrl', identityNetworkUrl);
  localStorage.setItem('subscriptionKey', subscriptionKey);

  if (!identityNetworkUrl || !subscriptionKey) {
    return $set('environmentStatus', 'Error: Please configure all environment fields');
  }

  environment = new Environment({
    vault: {
      url: '',
      subscription_key: subscriptionKey,
    },
    keystore: {
      url: '',
      subscription_key: subscriptionKey,
      provider_api_key: '',
    },
    identityNetwork: {
      url: identityNetworkUrl,
      subscription_key: subscriptionKey,
    },
  });

  $set('environmentStatus', 'Saved');
}

// Assumes modern browser with fetch
configureFetch(window.fetch);

$('resolveDID').addEventListener('click', resolveDID);
$('updateEnvironment').addEventListener('click', updateEnvironment);
$('createDID').addEventListener('click', createDID);
$('deactivateDID').addEventListener('click', deactivateDID);
$('copyResolveDID').addEventListener('click', () => copy(resolvedDidResult));
$('copyCreateDID').addEventListener('click', () => copy(createdDidResult));
$('copyDeativateDID').addEventListener('click', () => copy(deativateDIDResult));

async function resolveDID() {
  const identifier = $get('identifier');
  const api = new DIDManagementService(environment);
  const result = await api.resolve({}, identifier);
  const formatter = new JSONFormatter(result, 2);
  resolvedDidResult = JSON.stringify(result);
  $('didResolutionResult').replaceChildren(formatter.render());
  $('copyResolveDID').removeAttribute('disabled');
}

async function createDID() {
  const method = $get('DIDSelect');

  const array = new Uint8Array(32);
  const secret = self.crypto.getRandomValues(array);
  const keyPair = new Ed25519(secret);
  console.log(`public key hex: ${keyPair.getPublicKeyHex()}`);
  console.log(`private key hex: ${keyPair.keyPair.getSecret('hex')}`);

  let did: DIDBase;
  switch (method) {
    case 'sov':
      did = new DIDSov(keyPair);
      did.didDocument.service = [
        {
          type: 'LinkedDomains',
          serviceEndpoint: 'meeco.me',
        },
      ];
      break;
    case 'web':
      did = new DIDWeb(keyPair);
      const verificationMethodId = (did as DIDWeb).setVerificationMethod();
      (did as DIDWeb)
        .setAssertionMethod(verificationMethodId)
        .setAuthentication(verificationMethodId);

      break;
    default:
      did = new DIDKey(keyPair);
      break;
  }

  const api = new DIDManagementService(environment);
  const generatedDID = await api.create({}, did);
  const formatter = new JSONFormatter(generatedDID, 2);
  $('didCreationResult').replaceChildren(formatter.render());
  createdDidResult = JSON.stringify({
    secret: keyPair.keyPair.getSecret('hex'),
    publicKey: keyPair.getPublicKeyHex(),
    result: generatedDID,
  });
  $set('secretField', keyPair.keyPair.getSecret('hex'));
  $set('pkField', keyPair.getPublicKeyHex());
  $('copyCreateDID').removeAttribute('disabled');
}

function copy(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert('Copied to clipboard');
    })
    .catch(e => console.log(e));
}

async function deactivateDID() {
  const method = $get('DIDSelect');
  const didToDeactivate = $get('didFieldDeactivate');

  const secretKeyHex = $get('secretFieldDeactivate');
  const secret = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));

  const keyPair = new Ed25519(secret);

  let did: DIDBase;
  switch (method) {
    case 'sov':
      did = new DIDSov(keyPair);
      break;
    case 'web':
      did = new DIDWeb(keyPair);
      break;
    default:
      did = new DIDKey(keyPair);
      break;
  }
  did.didDocument.id = didToDeactivate;

  const api = new DIDManagementService(environment);
  const deactivatedDIDResult = await api.deactivate({}, did);
  const formatter = new JSONFormatter(deactivatedDIDResult, 2);
  $('didDeactivateResult').replaceChildren(formatter.render());
  deativateDIDResult = JSON.stringify(deactivatedDIDResult);

  $('copyDeativateDID').removeAttribute('disabled');

  console.log('last line');
}

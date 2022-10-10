import {
  configureFetch,
  DIDBase,
  DIDIndy,
  DIDKey,
  DIDManagementService,
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
let updateDIDResult: string = '';

$('copyResolveDID').setAttribute('disabled', 'true');
$('copyCreateDID').setAttribute('disabled', 'true');
$('copyDeativateDID').setAttribute('disabled', 'true');
$('copyUpdateDID').setAttribute('disabled', 'true');

const allOptions = [
  {
    name: 'key',
    label: 'key',
  },
  {
    name: 'web',
    label: 'web',
  },
  {
    name: 'indy',
    label: 'indy',
  },
];

const options = allOptions.map(t => `<option value="${t.name}">${t.label}</option>`).join('');

const optionsUpdateDeactivate = allOptions
  .filter(f => f.name !== 'key')
  .map(t => `<option value="${t.name}">${t.label}</option>`)
  .join('');

$('DIDSelect').innerHTML = options;
$('DIDSelectDeactivate').innerHTML = optionsUpdateDeactivate;
$('DIDSelectUpdate').innerHTML = optionsUpdateDeactivate;

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
$('updateDID').addEventListener('click', updateDID);
$('copyResolveDID').addEventListener('click', () => copy(resolvedDidResult));
$('copyCreateDID').addEventListener('click', () => copy(createdDidResult));
$('copyDeativateDID').addEventListener('click', () => copy(deativateDIDResult));
$('copyUpdateDID').addEventListener('click', () => copy(updateDIDResult));

async function resolveDID() {
  const identifier = $get('identifier');
  const api = new DIDManagementService(environment);
  let result: any = {};
  try {
    result = await api.resolve({}, identifier);
  } catch (e: any) {
    result = await extractResponseErrorBody(e, result);
  }
  const formatter = new JSONFormatter(result, 2);
  resolvedDidResult = JSON.stringify(result);
  $('didResolutionResult').replaceChildren(formatter.render());
  $('copyResolveDID').removeAttribute('disabled');
}

async function extractResponseErrorBody(e: any, result: any) {
  const textStreamReader = (e.response.body as ReadableStream)
    .pipeThrough(new TextDecoderStream())
    .getReader();
  while (true) {
    const { value, done } = await textStreamReader.read();
    if (done) {
      break;
    }
    console.log('Received', value);
    result = JSON.parse(value);
  }
  return result;
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
    case 'indy':
      did = new DIDIndy(keyPair);
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

      did.didDocument.service = [
        {
          type: 'LinkedDomains',
          serviceEndpoint: 'meeco.me',
        },
      ];

      break;
    default:
      did = new DIDKey(keyPair);
      break;
  }

  const api = new DIDManagementService(environment);

  let generatedDID: any = {};
  try {
    generatedDID = await api.create({}, did);
  } catch (e: any) {
    generatedDID = await extractResponseErrorBody(e, generatedDID);
  }

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
  const method = $get('DIDSelectDeactivate');
  const didToDeactivate = $get('didFieldDeactivate');

  const secretKeyHex = $get('secretFieldDeactivate');
  const secret = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));

  const keyPair = new Ed25519(secret);

  let did: DIDBase;
  switch (method) {
    case 'indy':
      did = new DIDIndy(keyPair);
      break;
    case 'web':
      did = new DIDWeb(keyPair);
      break;
    default:
      throw new Error('Not Supported');
  }
  did.didDocument.id = didToDeactivate;

  const api = new DIDManagementService(environment);

  let deactivatedDIDResult: any = {};
  try {
    deactivatedDIDResult = await api.deactivate({}, did);
  } catch (e: any) {
    deactivatedDIDResult = await extractResponseErrorBody(e, deactivatedDIDResult);
  }

  const formatter = new JSONFormatter(deactivatedDIDResult, 2);
  $('didDeactivateResult').replaceChildren(formatter.render());
  deativateDIDResult = JSON.stringify(deactivatedDIDResult);

  $('copyDeativateDID').removeAttribute('disabled');
}

async function updateDID() {
  const method = $get('DIDSelectUpdate');

  const secretKeyHex = $get('secretFieldUpdate');
  const secret = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));

  const keyPair = new Ed25519(secret);

  let did: DIDBase;
  switch (method) {
    case 'indy':
      did = new DIDIndy(keyPair);
      break;
    case 'web':
      did = new DIDWeb(keyPair);
      break;
    default:
      throw new Error('Not Supported');
  }
  did.didDocument = JSON.parse($get('didDocumentUpdate'));

  const api = new DIDManagementService(environment);

  let updatedDIDResult: any = {};
  try {
    updatedDIDResult = await api.update({}, did);
  } catch (e: any) {
    updatedDIDResult = await extractResponseErrorBody(e, updatedDIDResult);
  }

  const formatter = new JSONFormatter(updatedDIDResult, 2);
  $('didUpdateResult').replaceChildren(formatter.render());
  updateDIDResult = JSON.stringify(updatedDIDResult);

  $('copyUpdateDID').removeAttribute('disabled');
}

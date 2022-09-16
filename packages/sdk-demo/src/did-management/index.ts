import { configureFetch, Environment } from '@meeco/sdk';
import JSONFormatter from 'json-formatter-js';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);

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

async function resolveDID() {
  console.log(environment);
  const formatter = new JSONFormatter({}, 2);
  $('didResolutionResult').appendChild(formatter.render());
}

import {
  configureFetch,
  CredentialService,
  Ed25519,
  Environment,
  SigningAlg,
  vcAPIFactory,
} from '@meeco/sdk';
import JSONFormatter from 'json-formatter-js';

const $ = id => document.getElementById(id)!;
const $get = (id: string) => ($(id) as HTMLInputElement)?.value;
const $set = (id: string, value: string) => (($(id) as HTMLInputElement).value = value);

let environment: Environment;
let auth: {
  authorizationToken: string;
  organisationId: string;
};

const EXAMPLE_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2019-09/schema',
  name: 'Example',
  description: '',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['id', 'name'],
  additionalProperties: false,
};

const EXAMPLE_CLAIMS = {
  id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  name: 'Test User',
};

loadEnvironmentFromStorage();

$set('createSchemaJSON', JSON.stringify(EXAMPLE_SCHEMA, null, 2));
$set('credentialClaims', JSON.stringify(EXAMPLE_CLAIMS, null, 2));

function loadEnvironmentFromStorage() {
  const loadKey = (key: string) =>
    localStorage.getItem(key) ? $set(key, localStorage.getItem(key)!) : void 0;

  loadKey('vcUrl');
  loadKey('subscriptionKey');

  loadKey('authorizationToken');
  loadKey('organisationId');

  updateEnvironment();
}

function updateEnvironment() {
  const vcUrl = $get('vcUrl');
  const subscriptionKey = $get('subscriptionKey');

  const authorizationToken = $get('authorizationToken');
  const organisationId = $get('organisationId').trim();

  localStorage.setItem('vcUrl', vcUrl);
  localStorage.setItem('subscriptionKey', subscriptionKey);
  localStorage.setItem('authorizationToken', authorizationToken);
  localStorage.setItem('organisationId', organisationId);

  if (!vcUrl || !authorizationToken || !organisationId) {
    return $set('environmentStatus', 'Error: Please configure all environment & auth fields');
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
      url: '',
      subscription_key: subscriptionKey,
    },
    vc: {
      url: vcUrl,
      subscription_key: subscriptionKey,
    },
  });

  auth = {
    authorizationToken,
    organisationId,
  };

  $set('environmentStatus', 'Saved');
}

// Assumes modern browser with fetch
configureFetch(window.fetch);

$('updateEnvironment').addEventListener('click', updateEnvironment);
$('createSchema').addEventListener('click', createSchema);
$('createCredentialType').addEventListener('click', createCredentialType);
$('issueCredential').addEventListener('click', issueCredential);

const formatChild = (result: any) => new JSONFormatter(result, 2);

async function createSchema() {
  let schemaJSON;

  try {
    schemaJSON = JSON.parse($get('createSchemaJSON'));
  } catch (_e) {
    $('createSchemaResult').replaceChildren(formatChild('Invalid Schema JSON').render());
  }

  const api = vcAPIFactory(environment)({ vc_access_token: auth.authorizationToken });

  let resp;

  try {
    resp = await api.SchemasApi.schemasControllerCreate({
      schema: {
        name: schemaJSON?.name,
        schema_json: schemaJSON,
        organization_ids: [auth.organisationId],
      },
    });
  } catch (e: any) {
    resp = await extractResponseErrorBody(e, resp);
  }

  $('createSchemaResult').replaceChildren(formatChild(resp).render());
}

async function createCredentialType() {
  const name = $get('credentialTypeName')?.trim();
  const schemaId = $get('credentialTypeSchemaId')?.trim();

  if (!name || !schemaId) {
    $('createCredentialTypeResult').replaceChildren(
      formatChild('Please enter all parameters').render()
    );
    return;
  }

  const api = vcAPIFactory(environment)({ vc_access_token: auth.authorizationToken });

  let resp;
  try {
    resp = await api.CredentialTypesApi.credentialTypesControllerCreate(auth.organisationId, {
      credential_type: {
        name,
        schema_id: schemaId,
        format: 'jwt_vc_json', // TODO: make this configurable
        style: {
          text_color: '#FFF',
          background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
          image: 'https://vc.meeco.me/image.png',
        },
      },
    });
  } catch (e: any) {
    resp = await extractResponseErrorBody(e, resp);
  }

  $('createCredentialTypeResult').replaceChildren(formatChild(resp).render());
}

async function issueCredential() {
  const credentialTypeId = $get('credentialTypeId')?.trim();
  const issuer = $get('credentialIssuer')?.trim();
  let privateKeyBytes: Uint8Array;
  let claims: any;

  try {
    claims = JSON.parse($get('credentialClaims'));
  } catch (_e) {
    $('issueCredentialResult').replaceChildren(formatChild('Invalid claims format').render());
  }

  try {
    const buf = Buffer.from($get('credentialPrivateKeyHex')?.trim(), 'hex');
    privateKeyBytes = new Ed25519(Uint8Array.from(buf)).getSeed();
  } catch (_e) {
    $('issueCredentialResult').replaceChildren(formatChild('Invalid key hex').render());
  }

  if (!credentialTypeId || !issuer) {
    $('issueCredentialResult').replaceChildren(formatChild('Please enter all parameters').render());
    return;
  }

  const service = new CredentialService(environment);

  let resp;
  let payload;

  try {
    resp = await service.issue(
      { vc_access_token: auth.authorizationToken, organisation_id: auth.organisationId },
      {
        credential_type_id: credentialTypeId,
        issuer: { id: issuer },
        claims,
      },
      privateKeyBytes!,
      SigningAlg.EdDSA
    );

    const [_h, encodedPayload, _s] = resp.credential.split('.');
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf8'));
  } catch (e: any) {
    resp = await extractResponseErrorBody(e, resp);
  }

  $('issueCredentialResult').replaceChildren(formatChild(resp).render());

  if (payload) {
    $('issuerCredentialParseJWT').replaceChildren(formatChild(payload).render());
  }
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

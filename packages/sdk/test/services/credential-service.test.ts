import { expect } from 'chai';
import { Ed25519 } from '../../src/models/did-management/Ed25519';
import { CredentialService } from '../../src/services/credential-service';
import cryppo from '../../src/services/cryppo-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('CredentialService', () => {
  describe('#issue', () => {
    const ORGANISATION_ID = 'aff85397-402a-4b7a-8e0d-3d0e6a3533ee';
    const CREDENTIAL_TYPE_ID = 'eeea7a4b-c604-44c9-aed7-17b13e5b6726';
    const CREDENTIAL_CLAIMS = {
      name: 'Test User',
      country: 'Australia',
    };

    const secret = cryppo.binaryStringToBytes('abcdabcdabcdabcdabcdabcdabcdabcd');
    const keyPair = new Ed25519(secret);

    console.log(testUserAuth.vault_access_token);
    console.log(testUserAuth.vc_access_token);

    customTest
      .nock('https://vc-dev.meeco.me', api => {
        api
          .post('/credentials/generate')
          .matchHeader('Authorization', testUserAuth.vc_access_token)
          .matchHeader('X-Meeco-Organisation-Id', ORGANISATION_ID)
          // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
          .reply(401, {
            message: 'Unauthorized',
            http_code: 401,
            extra_info: {},
          });
      })
      .add('credential', () =>
        new CredentialService(environment).issue(
          testUserAuth,
          {
            issuer: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            credential_type_id: CREDENTIAL_TYPE_ID,
            claims: CREDENTIAL_CLAIMS,
          },
          ORGANISATION_ID,
          keyPair
        )
      )
      .catch(async (err: any) => {
        const text = await err.response.text();
        expect(text).to.eq('{"message":"Unauthorized","http_code":401,"extra_info":{}}');
        expect(err.response.status).to.eq(401);
      })
      .it('throws an error if unauthorized response is returned');

    customTest
      .nock('https://vc-dev.meeco.me', api => {
        api
          .post('/credentials/generate')
          .matchHeader('Authorization', testUserAuth.vc_access_token)
          .matchHeader('X-Meeco-Organisation-Id', ORGANISATION_ID)
          // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
          .reply(201, {
            credential: {
              unsigned_vc_jwt: 'header.test_payload',
              metadata: {
                style: {
                  'text-color': '#FFF',
                  background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                  image: 'https://vc.meeco.me/image.png',
                },
              },
            },
          });
      })
      .add('credential', () =>
        new CredentialService(environment).issue(
          testUserAuth,
          {
            issuer: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            credential_type_id: CREDENTIAL_TYPE_ID,
            claims: CREDENTIAL_CLAIMS,
          },
          ORGANISATION_ID,
          keyPair
        )
      )
      .it('returns signed credential and its metadata', ({ credential }) => {
        expect(credential).to.eql({
          credential:
            'header.test_payload._R4IKOrGOs4ggEHWT598QqEsG2UnwR8oVMHg60DxRBpUT75QfJ__-URCSC5bPp5ngswug2RKMrx03miB-GI4Dw==',
          metadata: {
            style: {
              background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
              image: 'https://vc.meeco.me/image.png',
              'text-color': '#FFF',
            },
          },
        });
      });
  });
});

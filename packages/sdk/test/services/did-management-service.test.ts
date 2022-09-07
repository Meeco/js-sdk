import { expect } from 'chai';
import { DIDManagementService } from '../../src/services/did-managment-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('IdentityNetworkService', () => {
  describe('#resolve', () => {
    const response = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        {
          Ed25519VerificationKey2018: 'https://w3id.org/security#Ed25519VerificationKey2018',
          publicKeyJwk: {
            '@id': 'https://w3id.org/security#publicKeyJwk',
            '@type': '@json',
          },
        },
      ],
      assertionMethod: [
        'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd#z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
      ],
      id: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
      verificationMethod: [
        {
          id: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd#z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          publicKeyJwk: {
            kty: 'OKP',
            crv: 'Ed25519',
            x: '3pDh06YBKdl6bLfT50AjCCTRkJ8-J_Qkq9tcUJpB74I',
          },
        },
      ],
      authentication: [
        'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd#z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
      ],
    };

    customTest
      .nock('https://identity-network-dev.meeco.me/v1', api => {
        api
          .get(`/did/did%3Akey%3Az6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd`)
          .once()
          .reply(200, response);
      })
      .add('result', () => new DIDManagementService(environment).resolve(testUserAuth))
      .it('resolve did', ({ result }) => {
        expect(result.didDocument.id).equals(
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd'
        );
      });
  });
});

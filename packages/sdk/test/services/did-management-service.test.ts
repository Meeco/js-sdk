import { expect } from 'chai';
import { DIDManagementService } from '../../src/services/did-managment-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('IdentityNetworkService', () => {
  describe('#resolve', () => {
    const response = {
      '@context': 'https://w3id.org/did-resolution/v1',
      didDocument: {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          {
            Ed25519VerificationKey2018: 'https://w3id.org/security#Ed25519VerificationKey2018',
            publicKeyJwk: { '@id': 'https://w3id.org/security#publicKeyJwk', '@type': '@json' },
          },
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
        assertionMethod: [
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd#z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
        ],
      },
      didResolutionMetadata: {
        pattern: '^did:(?:tz:|pkh:|web:|key:(?:z6Mk|zQ3s|zDna|z.{200,})).+$',
        driverUrl: 'http://driver-didkit:8080/identifiers/$1',
        duration: 8,
        did: {
          didString: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          methodSpecificId: 'z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          method: 'key',
        },
        contentType: 'application/did+ld+json',
        didUrl: {
          path: null,
          fragment: null,
          query: null,
          didUrlString: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          parameters: null,
          did: {
            didString: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            methodSpecificId: 'z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            method: 'key',
          },
        },
      },
      didDocumentMetadata: {},
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api
          .get(`/v1/did/did%3Akey%3Az6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd`)
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

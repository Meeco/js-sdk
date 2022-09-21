import { DidDocumentDto, DIDResolutionResultDto } from '@meeco/identity-network-api-sdk';
import { expect } from 'chai';
import { DIDSov } from '../../src/models/did-management/did-sov';
import { DIDKey } from '../../src/models/did-management/did-key';
import { DIDWeb } from '../../src/models/did-management/did-web';
import { Ed25519 } from '../../src/models/did-management/Ed25519';
import cryppo from '../../src/services/cryppo-service';
import { DIDManagementService } from '../../src/services/did-management-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('IdentityNetworkService', () => {
  const identifier = 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd';

  /**
   * Resolve DID with DID document representation or DID resolution result. https://w3c-ccg.github.io/did-resolution/#resolving
   */
  describe('#resolve with DID resolution result', () => {
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
        id: identifier,
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
      .add('result', () => new DIDManagementService(environment).resolve(testUserAuth, identifier))
      .it('resolve did', ({ result }) => {
        expect((result as DIDResolutionResultDto).didDocument.id).equals(identifier);
      });
  });

  /*
   * Resolve DID Document
   */
  describe('#resolve with DID resolution result', () => {
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
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api
          .get(`/v1/did/did%3Akey%3Az6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd`)
          .once()
          .reply(200, response);
      })
      .add('result', () =>
        new DIDManagementService(environment).resolve(
          testUserAuth,
          identifier,
          'application/did+ld+json'
        )
      )
      .it('resolve did', ({ result }) => {
        expect((result as DidDocumentDto).id).equals(identifier);
      });
  });

  // /*
  //  * Crate DID KEY
  //  */
  describe('#Create did KEY', () => {
    const secret = cryppo.binaryStringToBytes(cryppo.generateRandomBytesString(32));
    // currently this keypair is not in use. server generates keypair
    const keyPair = new Ed25519(secret);
    const didKey = new DIDKey(keyPair);

    const response = {
      jobId: null,
      didState: {
        did: 'did:key:z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp',
        state: 'finished',
        secret: {
          verificationMethod: [
            {
              id: 'did:key:z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp#z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp',
              type: 'JsonWebKey2020',
              controller: 'did:key:z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp',
              privateKeyJwk: {
                kty: 'OKP',
                crv: 'Ed25519',
                x: 'HmowyanulqykwUZpaqER_P-KWJS3Q98bU7BRqgK971s',
                d: 'vhUpstfWB_8gYyZ53RMECw6BBiqdvDugOfS-tnVhdec',
              },
              purpose: [
                'authentication',
                'assertionMethod',
                'capabilityInvocation',
                'capabilityDelegation',
              ],
            },
            {
              id: 'did:key:z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp#z6LSmY7sgjKPfpnD1xypvb9LFS3GCAzPNV51kaqwj2nfcKQs',
              type: 'JsonWebKey2020',
              controller: 'did:key:z6MkgVzC5o5TJxiH3F8thDgvRZak3e2dLnSm14b8ZDeeuChp',
              privateKeyJwk: {
                kty: 'OKP',
                crv: 'X25519',
                x: 'koSAn4UymHmRLGFsuxmh9RiBWkYrYJvcmC0Mn0jAFCg',
                d: '-Eqzz0IcePqmafE1euO76dN5W8rNrS9pNc6Wff_F8F4',
              },
              purpose: ['keyAgreement'],
            },
          ],
        },
      },
      didRegistrationMetadata: {
        duration: 159,
        method: 'key',
      },
      didDocumentMetadata: null,
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api.post(`/v1/did/create?method=key`).reply(201, response);
      })
      .add('result', () => new DIDManagementService(environment).create(testUserAuth, didKey))
      .it('resolve did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  // /*
  //  * Crate DID WEB
  //  */
  describe('#Create did WEB', () => {
    const secret = cryppo.binaryStringToBytes(cryppo.generateRandomBytesString(32));
    const keyPair = new Ed25519(secret);
    const didKey = new DIDWeb(keyPair);

    const response = {
      didState: {
        state: 'finished',
        did: 'did:web:did-web.meeco.me:a92ad118-1cc1-4c71-b20f-5b1ecf0db470',
        didDocument: {
          id: 'did:web:did-web.meeco.me:a92ad118-1cc1-4c71-b20f-5b1ecf0db470',
          verificationMethod: [
            {
              id: `did:web:did-web-meeco.me:${keyPair.getPublicKeyBase58()}#key-1`,
              type: 'Ed25519VerificationKey2018',
              publicKeyBase58: `${keyPair.getPublicKeyBase58()}`,
            },
          ],
          authentication: [`did:web:did-web-meeco.me:${keyPair.getPublicKeyBase58()}#key-1`],
          assertionMethod: [`did:web:did-web-meeco.me:${keyPair.getPublicKeyBase58()}#key-1`],
        },
      },
      didRegistrationMetadata: { duration: 114, method: 'web' },
      didDocumentMetadata: {},
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api.post(`/v1/did/create?method=web`).reply(201, response);
      })
      .add('result', () => new DIDManagementService(environment).create(testUserAuth, didKey))
      .it('resolve did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  /*
   * Crate DID SOV
   */
  describe('#Create did SOV', async () => {
    const secret = cryppo.generateRandomBytesString(32);
    const keyPair = new Ed25519(cryppo.binaryStringToBytes(secret));
    console.log(`public key hex: ${keyPair.getPublicKeyHex()}`);
    console.log(`private key hex: ${keyPair.keyPair.getSecret('hex')}`);

    const didSov = new DIDSov(keyPair);

    const response = {
      jobId: '00000000-0000-0000-0000-000000000000',
      didState: {
        state: 'finished',
        did: 'did:sov:danube:1234567890123456789012',
        secret: {
          verificationMethod: [
            [
              {
                id: '#key-1',
              },
              {
                id: 'did:sov:danube:1234567890123456789012#key-1',
                controller: 'did:sov:danube:1234567890123456789012',
              },
            ],
          ],
        },
      },
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api.post(`/v1/did/create?method=sov`).reply(201, response);
      })
      .add(
        'result',
        async () => await new DIDManagementService(environment).create(testUserAuth, didSov)
      )
      .it('resolve did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });
});

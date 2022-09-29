import { DidDocumentDto, DIDResolutionResultDto } from '@meeco/identity-network-api-sdk';
import { expect } from 'chai';
import { DIDKey } from '../../src/models/did-management/did-key';
import { DIDSov } from '../../src/models/did-management/did-sov';
import { DIDWeb } from '../../src/models/did-management/did-web';
import { Ed25519 } from '../../src/models/did-management/Ed25519';
import cryppo from '../../src/services/cryppo-service';
import { DIDManagementService } from '../../src/services/did-management-service';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('IdentityNetworkService', () => {
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
      .add('result', () =>
        new DIDManagementService(environment).resolve(
          testUserAuth,
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd'
        )
      )
      .it('resolve did', ({ result }) => {
        expect((result as DIDResolutionResultDto).didDocument.id).equals(
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd'
        );
      });
  });

  /**
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
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
          'application/did+ld+json'
        )
      )
      .it('resolve did', ({ result }) => {
        expect((result as DidDocumentDto).id).equals(
          'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd'
        );
      });
  });

  /**
   * Create DID KEY
   */
  describe('#Create DID KEY', () => {
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
      .it('created did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  /**
   * Create DID WEB
   */
  describe('#Create DID WEB', () => {
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
      .it('created did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  /**
   * Create DID SOV
   */
  describe('#Create DID SOV', async () => {
    const secret = cryppo.generateRandomBytesString(32);
    const keyPair = new Ed25519(cryppo.binaryStringToBytes(secret));

    const didSov = new DIDSov(keyPair);

    const responseStep1 = {
      jobId: null,
      didState: {
        verificationMethodTemplate: [
          {
            id: '#key-1',
            type: 'Ed25519VerificationKey2018',
            purpose: [
              'authentication',
              'assertionMethod',
              'capabilityInvocation',
              'capabilityDelegation',
            ],
          },
        ],
        action: 'getVerificationMethod',
        state: 'action',
      },
      didRegistrationMetadata: { duration: 16, method: 'sov' },
      didDocumentMetadata: {
        network: 'danube',
        poolVersion: 2,
        submitterDid: 'V4SGRU86Z58d6TV7PBUe6f',
      },
    };

    const responseStep2 = {
      jobId: '00000000-0000-0000-0000-000000000000',
      didState: {
        action: 'signPayload',
        state: 'action',
        signingRequest: {
          signingRequestAttrib: {
            kid: '#key-1',
            alg: 'EdDSA',
            purpose: 'authentication',
            payload: {
              identifier: 'QtaQcJSQU5HLSm16TgrW4a',
              operation: {
                dest: 'QtaQcJSQU5HLSm16TgrW4a',
                raw: '{"endpoint":{"LinkedDomains":"meeco.me"}}',
                type: '100',
              },
              protocolVersion: 2,
              reqId: 1664281491308847600,
            },
            serializedPayload:
              'aWRlbnRpZmllcjpRdGFRY0pTUVU1SExTbTE2VGdyVzRhfG9wZXJhdGlvbjpkZXN0OlF0YVFjSlNRVTVITFNtMTZUZ3JXNGF8cmF3OmZiODZhMjQyMmU5OGRiMjZlNmE3NTIyMzg5NzA4YTUzOTVkZjZlODcxZmZhOGRjYTYzYjUxOTFmODdhNTRkZjJ8dHlwZToxMDB8cHJvdG9jb2xWZXJzaW9uOjJ8cmVxSWQ6MTY2NDI4MTQ5MTMwODg0NzYwMA==',
          },
        },
      },
      didRegistrationMetadata: { duration: 236, method: 'sov' },
      didDocumentMetadata: {
        network: 'danube',
        poolVersion: 2,
        submitterDid: 'V4SGRU86Z58d6TV7PBUe6f',
        ledgerResult: {
          result: {
            reqSignature: {
              type: 'ED25519',
              values: [
                {
                  value:
                    '4b2XwTJxg8CKBFFYzgMKXpEkkQSFxhhXopN1hrpTZg4cnFSGWt56R2tcGBB4S6TZegDrTRNsRVugV4z9RSuCBZRN',
                  from: 'V4SGRU86Z58d6TV7PBUe6f',
                },
              ],
            },
            txn: {
              data: {
                verkey: 'E2BnizhF4xsuk7MtGARDpCr5GdUvYgYt4oeAuBxjLtiT',
                dest: 'QtaQcJSQU5HLSm16TgrW4a',
              },
              type: '1',
              metadata: {
                from: 'V4SGRU86Z58d6TV7PBUe6f',
                digest: '6adba5e8598daf58415fbf2654c7b9318b59861e990259e5688ea4141acf521b',
                reqId: 1664281491307149800,
                payloadDigest: '583f60d2cbdca1a69d86f12446fe0b9ba1f3fd35eeebea37f9608dad0344117c',
              },
              protocolVersion: 2,
            },
            rootHash: '82heHKp9x5S1Vneg1sq475uyS3nP12oVLmG5DrvrgYrb',
            ver: '1',
            txnMetadata: {
              seqNo: 461,
              txnId: '64fd9d4d4e14d6be11a962ec514ab570416881067a438af75b781faa32354edd',
              txnTime: 1664281491,
            },
            auditPath: [
              'br9Cv2fTEwf8RZNuEcXQvdYYBBL6EoCjWxrqdVnkvm5',
              '6Bgq9VDiXFhcKA9f25wxCFxQJEJYhz45Y3Z7Ud7Eoruq',
              '4vsoGeGnKZxG2s8bWorqWCw1obdFtAbJMVGVaVxyorFN',
              'ApTip5m6d41gSbMdQNGGPG6ZXjgMqxNAxmUrfRAKn9oi',
              'fJmjQSTznz4XBq7q5xbKJYiWw6Wu7WbkHjELsxsXb2a',
            ],
          },
          op: 'REPLY',
        },
      },
    };

    const responseStep3 = {
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
        api
          .post(`/v1/did/create?method=sov`, body => {
            expect(body).to.eql({
              options: { clientSecretMode: true, network: 'danube' },
              didDocument: {},
            });
            return true;
          })
          .once()
          .reply(201, responseStep1);
        api
          .post(`/v1/did/create?method=sov`, body => {
            expect(body.options).to.eql({ clientSecretMode: true, network: 'danube' });
            expect(body.didDocument.verificationMethod[0].id).to.equal('#key-1');
            expect(body.didDocument.verificationMethod[0].type).to.equal(
              'Ed25519VerificationKey2018'
            );
            expect(body.didDocument.verificationMethod[0].publicKeyBase58).to.be.a('string');
            return true;
          })
          .once()
          .reply(201, responseStep2);
        api
          .post(`/v1/did/create?method=sov`, body => {
            expect(body.options).to.eql({ clientSecretMode: true });
            expect(body.jobId).to.eql('00000000-0000-0000-0000-000000000000');
            expect(body.secret.signingResponse.signingRequestAttrib.signature).to.be.a('string');
            return true;
          })
          .once()
          .reply(201, responseStep3);
      })
      .add(
        'result',
        async () => await new DIDManagementService(environment).create(testUserAuth, didSov)
      )
      .it('created did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  /**
   * Update DID SOV
   */
  describe('#Update DID SOV', async () => {
    const secret = cryppo.binaryStringToBytes(cryppo.generateRandomBytesString(32));
    const keyPair = new Ed25519(secret);

    const didSov = new DIDSov(
      keyPair,
      {
        id: 'did:sov:danube:9RJposSSY3pp4qzuN82gRw',
        service: [{ type: 'DIDComm', serviceEndpoint: 'https://meeco.me' }],
      },
      { network: 'danube' }
    );

    const response = {
      jobId: null,
      didState: { state: 'finished', secret: {}, did: 'did:sov:danube:9RJposSSY3pp4qzuN82gRw' },
      didRegistrationMetadata: { duration: 1290, method: 'sov' },
      didDocumentMetadata: {
        network: 'danube',
        poolVersion: 2,
        submitterDid: 'V4SGRU86Z58d6TV7PBUe6f',
        ledgerResult: {
          result: {
            reqSignature: {
              type: 'ED25519',
              values: [
                {
                  value:
                    '2iXz1WZqCc1AJbi8qsCc9c2yFoRTNj4A1Ws1kJ5yR68TX1jbZTY1b2Dju2GUShwtg6BfWXEXaS4BM3vvBHUHjghJ',
                  from: '9RJposSSY3pp4qzuN82gRw',
                },
              ],
            },
            txn: {
              data: {
                raw: '{"endpoint":{"DIDComm":"https://meeco.me"}}',
                dest: '9RJposSSY3pp4qzuN82gRw',
              },
              type: '100',
              protocolVersion: 2,
              metadata: {
                from: '9RJposSSY3pp4qzuN82gRw',
                digest: 'ea6c0442d794e014a88bc839a417b3b513e3604a794da6505e1eb61b1aabfaa9',
                reqId: 1664285181243356400,
                payloadDigest: '34939239bbfa61e323d131d40ec5a66ab691d26aa70f846b97b543a763bbe152',
              },
            },
            rootHash: 'F4Je3M3sz2k28qfpPj9wNzzZhT6BZFGSTn3o3HUGfAim',
            ver: '1',
            txnMetadata: {
              seqNo: 467,
              txnId:
                '9RJposSSY3pp4qzuN82gRw:1:b6bf7bc8d96f3ea9d132c83b3da8e7760e420138485657372db4d6a981d3fd9e',
              txnTime: 1664285182,
            },
            auditPath: [
              '6gcL2NChwDyNiLyXrEGEPB27odqLRQE6fqRJJrqgC8Uf',
              '44jpcdqLtrqmRdS1YDpRb7vWcaVrvZdMiZa7e5hoLGXp',
              '4vsoGeGnKZxG2s8bWorqWCw1obdFtAbJMVGVaVxyorFN',
              'ApTip5m6d41gSbMdQNGGPG6ZXjgMqxNAxmUrfRAKn9oi',
              'fJmjQSTznz4XBq7q5xbKJYiWw6Wu7WbkHjELsxsXb2a',
            ],
          },
          op: 'REPLY',
        },
      },
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api
          .post(`/v1/did/update?method=sov`, body => {
            expect(body).to.eql({
              did: 'did:sov:danube:9RJposSSY3pp4qzuN82gRw',
              didDocument: {
                id: 'did:sov:danube:9RJposSSY3pp4qzuN82gRw',
                service: [
                  {
                    serviceEndpoint: 'https://meeco.me',
                    type: 'DIDComm',
                  },
                ],
              },
              didDocumentOperation: [],
              options: {
                network: 'danube',
              },
            });
            return true;
          })
          .reply(200, response);
      })
      .add('result', () => new DIDManagementService(environment).update(testUserAuth, didSov))
      .it('updated did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });

  /**
   * Deactivate DID
   */
  describe('#Deactivate DID SOV', async () => {
    const secret = cryppo.generateRandomBytesString(32);
    const keyPair = new Ed25519(cryppo.binaryStringToBytes(secret));

    const didSov = new DIDSov(keyPair, {
      id: 'did:sov:danube:TVhirwuz9cqBLMAGTC5otN',
    });

    const response = {
      jobId: '00000000-0000-0000-0000-000000000000',
      didState: {
        state: 'finished',
        did: 'did:sov:danube:TVhirwuz9cqBLMAGTC5otN',
        secret: {},
      },
    };

    customTest
      .nock('https://identity-network-dev.meeco.me', api => {
        api.post(`/v1/did/deactivate?method=sov`).reply(200, response);
      })
      .add(
        'result',
        async () => await new DIDManagementService(environment).deactivate(testUserAuth, didSov)
      )
      .it('deactivated did', ({ result }) => {
        expect(result.didState?.state).equals('finished');
      });
  });
});

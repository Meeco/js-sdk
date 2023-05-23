import { SigningAlg } from '@meeco/sdk';
import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { expect } from 'chai';
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

    const userAuth = {
      ...testUserAuth,
      organisation_id: ORGANISATION_ID,
    };

    describe('EdDSA', () => {
      const secret = cryppo.binaryStringToBytes('abcdabcdabcdabcdabcdabcdabcdabcd');
      const keyPair = generateKeyPairFromSeed(secret);
      const issuerDID = 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd';

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(401, {
              message: 'Unauthorized',
              http_code: 401,
              extra_info: {},
            });
        })
        .add('credential', () =>
          new CredentialService(environment).issue(
            userAuth,
            {
              issuer: { id: issuerDID },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            keyPair.secretKey,
            SigningAlg.EdDSA
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
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWtnQ3ZHaVNmSmo2aGZwUlZIVzZGcWZtV1V5ejd2eHU4Z3V6cTdmY0VDQzlERSJ9',
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
            userAuth,
            {
              issuer: {
                id: issuerDID,
                name: 'test-issuer',
              },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            keyPair.secretKey,
            SigningAlg.EdDSA
          )
        )
        .it('returns signed credential and its metadata with issuer name', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCJ9.GbYNLCnZm0f8_Mi_jculfbD58Ol4EBEsq3SjE61EB-Rxvg_NSiNx1qUQYjaQK5tYdhBKc5SMDR5ABiT3RYUQDw',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                'text-color': '#FFF',
              },
            },
          });
        });

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOnsiaWQiOiJkaWQ6a2V5Ono2TWtnQ3ZHaVNmSmo2aGZwUlZIVzZGcWZtV1V5ejd2eHU4Z3V6cTdmY0VDQzlERSIsIm5hbWUiOiJ0ZXN0LWlzc3VlciJ9fQ',
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
            userAuth,
            {
              issuer: {
                id: issuerDID,
                name: 'test-issuer',
              },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            keyPair.secretKey,
            SigningAlg.EdDSA
          )
        )
        .it('returns signed credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCJ9.gkvjOFxDplRSdAFUJY3k6bmkVTjK-vFCsI53LLJDZuYMkb1A7zdHvbRDLAtzrKoXY2kd4-g4mWc3jVD4w7FbBg',
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

    describe('ES256K', () => {
      const privateKeyBytes = Buffer.from(
        '2aa7d6d1c65e3bda76ab1d709e2eb9b46dddf05ab9ce70bc2f137730d92d59dd',
        'hex'
      );
      const issuerDID = 'did:key:zQ3shfZn2QwYA8KrSRCdwSHWYGtQWKa69FR8sjmmPMZDLc4rL';

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(401, {
              message: 'Unauthorized',
              http_code: 401,
              extra_info: {},
            });
        })
        .add('credential', () =>
          new CredentialService(environment).issue(
            userAuth,
            {
              issuer: { id: issuerDID },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            privateKeyBytes,
            SigningAlg.ES256K
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
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWtnQ3ZHaVNmSmo2aGZwUlZIVzZGcWZtV1V5ejd2eHU4Z3V6cTdmY0VDQzlERSJ9',
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
            userAuth,
            {
              issuer: {
                id: issuerDID,
                name: 'test-issuer',
              },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            privateKeyBytes,
            SigningAlg.ES256K
          )
        )
        .it('returns signed credential and its metadata with issuer name', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwifQ.EWY756i7RoCeOP1lefsfY85GDcLlkOd1r45LZUVHo-SNk0JmdVMnw-MVCMk8O8d8LOGuaBHwO4UGnznbande6w',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                'text-color': '#FFF',
              },
            },
          });
        });

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            // .matchHeader('Meeco-Subscription-Key', environment.vc.subscription_key)
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOnsiaWQiOiJkaWQ6a2V5Ono2TWtnQ3ZHaVNmSmo2aGZwUlZIVzZGcWZtV1V5ejd2eHU4Z3V6cTdmY0VDQzlERSIsIm5hbWUiOiJ0ZXN0LWlzc3VlciJ9fQ',
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
            userAuth,
            {
              issuer: {
                id: issuerDID,
                name: 'test-issuer',
              },
              credential_type_id: CREDENTIAL_TYPE_ID,
              claims: CREDENTIAL_CLAIMS,
            },
            privateKeyBytes,
            SigningAlg.ES256K
          )
        )
        .it('returns signed credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwifQ.4DbFu02ZeuPd8J4JV0VUcEwmguP_mfQG2Catv8BhcE3QfJL74N2uyBBobZd-155ONN_m8sc35tQLWcHPxheFDA',
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
});

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

    const userAuth = {
      ...testUserAuth,
      organisation_id: ORGANISATION_ID,
    };

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
            issuer: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            credential_type_id: CREDENTIAL_TYPE_ID,
            claims: CREDENTIAL_CLAIMS,
          },
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
            issuer: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
            credential_type_id: CREDENTIAL_TYPE_ID,
            claims: CREDENTIAL_CLAIMS,
          },
          keyPair
        )
      )
      .it('returns signed credential and its metadata with issuer name', ({ credential }) => {
        expect(credential).to.eql({
          credential:
            'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCJ9.zd90uFGN4qhLU_KTbizD0UcoVHrtBu-aGRXXBmfPSbK4tw16wwL7sc60lhbNECuuD_7WV6n5okiF_uep7sqdAA',
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
              id: 'did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd',
              name: 'test-issuer',
            },
            credential_type_id: CREDENTIAL_TYPE_ID,
            claims: CREDENTIAL_CLAIMS,
          },
          keyPair
        )
      )
      .it('returns signed credential and its metadata', ({ credential }) => {
        expect(credential).to.eql({
          credential:
            'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCJ9.JSydrIW1HXIk9XmF5Kdpj8T73tObROc8CtIsQZvfu6ZgAnUkqfUgAAZG4cAh7ei3OoFEBsRwk_myeGYJmHC5BA',
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

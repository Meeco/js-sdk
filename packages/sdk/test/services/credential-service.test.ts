import { DecryptedItem, DecryptedItems, ItemService, SigningAlg } from '@meeco/sdk';
import { CredentialsControllerGenerateAcceptEnum } from '@meeco/vc-api-sdk';
import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { expect } from 'chai';
import sinon from 'sinon';
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
                text_color: '#FFF',
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
                text_color: '#FFF',
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
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.EdDSA,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it(
          'returns signed sd jwt credential and its metadata with issuer name',
          ({ credential }) => {
            expect(credential).to.eql({
              credential:
                'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImlkIjoidXJuOnV1aWQ6ZGRlNGU3YTEtNjM5Yi00NDgwLTliYjktYThlOWEzY2Y1NGY1IiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOnsiaWQiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwibmFtZSI6InZpamF5IHRlc3QgTkYgMiJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJfc2QiOlsiM05fN192NDdvMmpsS1lnVWJXcDZoOEhnMzJYYTU5VjJYTlpQTEg2bG9ZdyIsIkVkb3VlYWM5VW1tMDZKcEMtVXFPU3RMdWEtaUgyVUY1RE5zTklVOEdkNFEiLCJMLUV3SlFMZC0wX2xTaVk2RjNUM3E1blg4ZVhQN0FHUkhjenhqLVgxSGlrIiwia3NUS0t5TXc2Zm5oUzdtbjB5ekk3ZTdWU0xid081aDFsQVdtNi1CWTdKSSIsInhsNnBnMGxQZTZBYkJSSUdSVHFycF9POVBfQkx6QXctbHR3NGIyMVVaLUEiXX0sImlzc3VhbmNlRGF0ZSI6IjIwMjMtMTAtMjdUMDc6MDE6MzBaIiwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc2NoZW1hcy9lNmZlZWM2OC00NjE3LTRkMGYtYThiOC1kZmM0NDIzODdjOTUvMS4wLjAvc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifSwiZXhwaXJhdGlvbkRhdGUiOiIyMDIzLTEwLTI0VDE0OjAwOjAwWiIsImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEjMTg3IiwidHlwZSI6IlN0YXR1c0xpc3QyMDIxRW50cnkiLCJzdGF0dXNQdXJwb3NlIjoicmV2b2NhdGlvbiIsInN0YXR1c0xpc3RJbmRleCI6MTg3LCJzdGF0dXNMaXN0Q3JlZGVudGlhbCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSJ9fSwiX3NkX2FsZyI6InNoYS0yNTYifQ.9O-FEh2KjRwi6RYx8iieYxmW1dAR11jZnq_kzo6ffABeTXW8G98VXNleMe9uAyOEbGzQehg4EXgz-IAKzDoqAA~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
              metadata: {
                style: {
                  background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                  image: 'https://vc.meeco.me/image.png',
                  text_color: '#FFF',
                },
              },
            });
          }
        );

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.EdDSA,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it('returns signed sd jwt credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5Ono2TWt1UzRndWR5dWlGcDVNR1RzRmZQU3luNHVVUUtoWTh2RkZ6UE1OUURBTm9MZCIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImlkIjoidXJuOnV1aWQ6ZGRlNGU3YTEtNjM5Yi00NDgwLTliYjktYThlOWEzY2Y1NGY1IiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOnsiaWQiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwibmFtZSI6InZpamF5IHRlc3QgTkYgMiJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJfc2QiOlsiM05fN192NDdvMmpsS1lnVWJXcDZoOEhnMzJYYTU5VjJYTlpQTEg2bG9ZdyIsIkVkb3VlYWM5VW1tMDZKcEMtVXFPU3RMdWEtaUgyVUY1RE5zTklVOEdkNFEiLCJMLUV3SlFMZC0wX2xTaVk2RjNUM3E1blg4ZVhQN0FHUkhjenhqLVgxSGlrIiwia3NUS0t5TXc2Zm5oUzdtbjB5ekk3ZTdWU0xid081aDFsQVdtNi1CWTdKSSIsInhsNnBnMGxQZTZBYkJSSUdSVHFycF9POVBfQkx6QXctbHR3NGIyMVVaLUEiXX0sImlzc3VhbmNlRGF0ZSI6IjIwMjMtMTAtMjdUMDc6MDE6MzBaIiwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc2NoZW1hcy9lNmZlZWM2OC00NjE3LTRkMGYtYThiOC1kZmM0NDIzODdjOTUvMS4wLjAvc2NoZW1hLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifSwiZXhwaXJhdGlvbkRhdGUiOiIyMDIzLTEwLTI0VDE0OjAwOjAwWiIsImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEjMTg3IiwidHlwZSI6IlN0YXR1c0xpc3QyMDIxRW50cnkiLCJzdGF0dXNQdXJwb3NlIjoicmV2b2NhdGlvbiIsInN0YXR1c0xpc3RJbmRleCI6MTg3LCJzdGF0dXNMaXN0Q3JlZGVudGlhbCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSJ9fSwiX3NkX2FsZyI6InNoYS0yNTYifQ.9O-FEh2KjRwi6RYx8iieYxmW1dAR11jZnq_kzo6ffABeTXW8G98VXNleMe9uAyOEbGzQehg4EXgz-IAKzDoqAA~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                text_color: '#FFF',
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
                text_color: '#FFF',
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
                text_color: '#FFF',
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
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.ES256K,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it(
          'returns signed sd jwt credential and its metadata with issuer name',
          ({ credential }) => {
            expect(credential).to.eql({
              credential:
                'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6InVybjp1dWlkOmRkZTRlN2ExLTYzOWItNDQ4MC05YmI5LWE4ZTlhM2NmNTRmNSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpkaWQtd2ViLnNlY3VyZXZhbHVlLmV4Y2hhbmdlOmViNmM1MjExLWJjN2YtNGYwNS1hOTgzLTk4OGJiMjAzYTk3YyIsIm5hbWUiOiJ2aWpheSB0ZXN0IE5GIDIifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiX3NkIjpbIjNOXzdfdjQ3bzJqbEtZZ1ViV3A2aDhIZzMyWGE1OVYyWE5aUExINmxvWXciLCJFZG91ZWFjOVVtbTA2SnBDLVVxT1N0THVhLWlIMlVGNUROc05JVThHZDRRIiwiTC1Fd0pRTGQtMF9sU2lZNkYzVDNxNW5YOGVYUDdBR1JIY3p4ai1YMUhpayIsImtzVEtLeU13NmZuaFM3bW4weXpJN2U3VlNMYndPNWgxbEFXbTYtQlk3SkkiLCJ4bDZwZzBsUGU2QWJCUklHUlRxcnBfTzlQX0JMekF3LWx0dzRiMjFVWi1BIl19LCJpc3N1YW5jZURhdGUiOiIyMDIzLTEwLTI3VDA3OjAxOjMwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3NjaGVtYXMvZTZmZWVjNjgtNDYxNy00ZDBmLWE4YjgtZGZjNDQyMzg3Yzk1LzEuMC4wL3NjaGVtYS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImV4cGlyYXRpb25EYXRlIjoiMjAyMy0xMC0yNFQxNDowMDowMFoiLCJjcmVkZW50aWFsU3RhdHVzIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIzE4NyIsInR5cGUiOiJTdGF0dXNMaXN0MjAyMUVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOjE4Nywic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEifX0sIl9zZF9hbGciOiJzaGEtMjU2In0.9Gtkk4NbDF4IBPwIMClZpPF_93VdDi6hkoDeS-YdwvN-JuENbijZvNhVgWcjKaDXEoDFAHKhqJc2RYxVrCxgZg~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
              metadata: {
                style: {
                  background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                  image: 'https://vc.meeco.me/image.png',
                  text_color: '#FFF',
                },
              },
            });
          }
        );

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.ES256K,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it('returns signed sd jwt credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6InVybjp1dWlkOmRkZTRlN2ExLTYzOWItNDQ4MC05YmI5LWE4ZTlhM2NmNTRmNSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpkaWQtd2ViLnNlY3VyZXZhbHVlLmV4Y2hhbmdlOmViNmM1MjExLWJjN2YtNGYwNS1hOTgzLTk4OGJiMjAzYTk3YyIsIm5hbWUiOiJ2aWpheSB0ZXN0IE5GIDIifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiX3NkIjpbIjNOXzdfdjQ3bzJqbEtZZ1ViV3A2aDhIZzMyWGE1OVYyWE5aUExINmxvWXciLCJFZG91ZWFjOVVtbTA2SnBDLVVxT1N0THVhLWlIMlVGNUROc05JVThHZDRRIiwiTC1Fd0pRTGQtMF9sU2lZNkYzVDNxNW5YOGVYUDdBR1JIY3p4ai1YMUhpayIsImtzVEtLeU13NmZuaFM3bW4weXpJN2U3VlNMYndPNWgxbEFXbTYtQlk3SkkiLCJ4bDZwZzBsUGU2QWJCUklHUlRxcnBfTzlQX0JMekF3LWx0dzRiMjFVWi1BIl19LCJpc3N1YW5jZURhdGUiOiIyMDIzLTEwLTI3VDA3OjAxOjMwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3NjaGVtYXMvZTZmZWVjNjgtNDYxNy00ZDBmLWE4YjgtZGZjNDQyMzg3Yzk1LzEuMC4wL3NjaGVtYS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImV4cGlyYXRpb25EYXRlIjoiMjAyMy0xMC0yNFQxNDowMDowMFoiLCJjcmVkZW50aWFsU3RhdHVzIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIzE4NyIsInR5cGUiOiJTdGF0dXNMaXN0MjAyMUVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOjE4Nywic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEifX0sIl9zZF9hbGciOiJzaGEtMjU2In0.9Gtkk4NbDF4IBPwIMClZpPF_93VdDi6hkoDeS-YdwvN-JuENbijZvNhVgWcjKaDXEoDFAHKhqJc2RYxVrCxgZg~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                text_color: '#FFF',
              },
            },
          });
        });
    });

    describe('ES256', () => {
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
            SigningAlg.ES256
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
            SigningAlg.ES256
          )
        )
        .it('returns signed credential and its metadata with issuer name', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwifQ.XzP7t9FdUtDASYVoIFlMmf7adITje0VHCLMoeAFDSwrPCX_GE7AVTtYXPUyNXr2JjjQb8lm1DaKQIBt3Q0zL5w',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                text_color: '#FFF',
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
            SigningAlg.ES256
          )
        )
        .it('returns signed credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTg5MzQ5OTIwMCwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDoyM2I4NDFmMi1hM2RjLTQ3N2YtYTllMS01MDI0ZDFkY2MwMmIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmFtZSI6InRlc3QtaXNzdWVyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rZ0N2R2lTZkpqNmhmcFJWSFc2RnFmbVdVeXo3dnh1OGd1enE3ZmNFQ0M5REUiLCJuYW1lIjoidGVzdCJ9LCJpc3N1YW5jZURhdGUiOiIyMDIyLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9zY2hlbWFzLzFjY2Q1ZmI3LTZiZDUtNDkzMy04NjM2LWRlZDNjYjc5ODFhNi8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMzAtMDEtMDFUMTI6MDA6MDBaIn0sInN1YiI6ImRpZDprZXk6ejZNa2dDdkdpU2ZKajZoZnBSVkhXNkZxZm1XVXl6N3Z4dThndXpxN2ZjRUNDOURFIiwibmJmIjoxNjQwOTk1MjAwLCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwifQ._hd-U6FV4Jzk34elapEQ3T_W4CQLeY_KlA_wRz-PpRzRwFOL9WIkr9pKxGNOqtR--dBRkxQeXOUrWazHLc-Qlg',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                text_color: '#FFF',
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
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.ES256,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it(
          'returns signed sd jwt credential and its metadata with issuer name',
          ({ credential }) => {
            expect(credential).to.eql({
              credential:
                'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6InVybjp1dWlkOmRkZTRlN2ExLTYzOWItNDQ4MC05YmI5LWE4ZTlhM2NmNTRmNSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpkaWQtd2ViLnNlY3VyZXZhbHVlLmV4Y2hhbmdlOmViNmM1MjExLWJjN2YtNGYwNS1hOTgzLTk4OGJiMjAzYTk3YyIsIm5hbWUiOiJ2aWpheSB0ZXN0IE5GIDIifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiX3NkIjpbIjNOXzdfdjQ3bzJqbEtZZ1ViV3A2aDhIZzMyWGE1OVYyWE5aUExINmxvWXciLCJFZG91ZWFjOVVtbTA2SnBDLVVxT1N0THVhLWlIMlVGNUROc05JVThHZDRRIiwiTC1Fd0pRTGQtMF9sU2lZNkYzVDNxNW5YOGVYUDdBR1JIY3p4ai1YMUhpayIsImtzVEtLeU13NmZuaFM3bW4weXpJN2U3VlNMYndPNWgxbEFXbTYtQlk3SkkiLCJ4bDZwZzBsUGU2QWJCUklHUlRxcnBfTzlQX0JMekF3LWx0dzRiMjFVWi1BIl19LCJpc3N1YW5jZURhdGUiOiIyMDIzLTEwLTI3VDA3OjAxOjMwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3NjaGVtYXMvZTZmZWVjNjgtNDYxNy00ZDBmLWE4YjgtZGZjNDQyMzg3Yzk1LzEuMC4wL3NjaGVtYS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImV4cGlyYXRpb25EYXRlIjoiMjAyMy0xMC0yNFQxNDowMDowMFoiLCJjcmVkZW50aWFsU3RhdHVzIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIzE4NyIsInR5cGUiOiJTdGF0dXNMaXN0MjAyMUVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOjE4Nywic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEifX0sIl9zZF9hbGciOiJzaGEtMjU2In0.w2tzz2Dxbrjs-NCdfxPLPBRNnMs0pdIexotFnTJJdVlykqlEzdbag3wj0ScP9W4q-MaWVIMEO2-dLa7BdS8fVA~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
              metadata: {
                style: {
                  background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                  image: 'https://vc.meeco.me/image.png',
                  text_color: '#FFF',
                },
              },
            });
          }
        );

      customTest
        .nock('https://vc-dev.meeco.me', api => {
          api
            .post('/credentials/generate')
            .matchHeader('Authorization', userAuth.vc_access_token)
            .matchHeader('Meeco-Organisation-Id', ORGANISATION_ID)
            .matchHeader('Accept', 'application/vc+sd-jwt')
            .reply(201, {
              credential: {
                unsigned_vc_jwt:
                  'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZERTQSJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6ZWI2YzUyMTEtYmM3Zi00ZjA1LWE5ODMtOTg4YmIyMDNhOTdjIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDpkZGU0ZTdhMS02MzliLTQ0ODAtOWJiOS1hOGU5YTNjZjU0ZjUiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5zZWN1cmV2YWx1ZS5leGNoYW5nZTplYjZjNTIxMS1iYzdmLTRmMDUtYTk4My05ODhiYjIwM2E5N2MiLCJuYW1lIjoidmlqYXkgdGVzdCBORiAyIn0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Il9zZCI6WyIzTl83X3Y0N28yamxLWWdVYldwNmg4SGczMlhhNTlWMlhOWlBMSDZsb1l3IiwiRWRvdWVhYzlVbW0wNkpwQy1VcU9TdEx1YS1pSDJVRjVETnNOSVU4R2Q0USIsIkwtRXdKUUxkLTBfbFNpWTZGM1QzcTVuWDhlWFA3QUdSSGN6eGotWDFIaWsiLCJrc1RLS3lNdzZmbmhTN21uMHl6STdlN1ZTTGJ3TzVoMWxBV202LUJZN0pJIiwieGw2cGcwbFBlNkFiQlJJR1JUcXJwX085UF9CTHpBdy1sdHc0YjIxVVotQSJdfSwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yN1QwNzowMTozMFoiLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zY2hlbWFzL2U2ZmVlYzY4LTQ2MTctNGQwZi1hOGI4LWRmYzQ0MjM4N2M5NS8xLjAuMC9zY2hlbWEuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJleHBpcmF0aW9uRGF0ZSI6IjIwMjMtMTAtMjRUMTQ6MDA6MDBaIiwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6Imh0dHBzOi8vYXBpLWRldi5zdnguZXhjaGFuZ2Uvc3RhdHVzX2xpc3QvMSMxODciLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxODcsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIn19LCJfc2RfYWxnIjoic2hhLTI1NiJ9.~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
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
            SigningAlg.ES256,
            CredentialsControllerGenerateAcceptEnum.VcsdJwt
          )
        )
        .it('returns signed sd jwt credential and its metadata', ({ credential }) => {
          expect(credential).to.eql({
            credential:
              'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE2OTgzOTAwOTIzNjcsImNuZiI6eyJqd2siOnsia3R5IjoiT0tQIiwiY3J2IjoiRWQyNTUxOSIsIngiOiIzZWx4T0dESFpvb0wwYjBqakpXWVRLS3g4dkZwcEkwZEZkWnFjVVdIWU9zIn19LCJpc3MiOiJkaWQ6a2V5OnpRM3NoZlpuMlF3WUE4S3JTUkNkd1NIV1lHdFFXS2E2OUZSOHNqbW1QTVpETGM0ckwiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6InVybjp1dWlkOmRkZTRlN2ExLTYzOWItNDQ4MC05YmI5LWE4ZTlhM2NmNTRmNSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpkaWQtd2ViLnNlY3VyZXZhbHVlLmV4Y2hhbmdlOmViNmM1MjExLWJjN2YtNGYwNS1hOTgzLTk4OGJiMjAzYTk3YyIsIm5hbWUiOiJ2aWpheSB0ZXN0IE5GIDIifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiX3NkIjpbIjNOXzdfdjQ3bzJqbEtZZ1ViV3A2aDhIZzMyWGE1OVYyWE5aUExINmxvWXciLCJFZG91ZWFjOVVtbTA2SnBDLVVxT1N0THVhLWlIMlVGNUROc05JVThHZDRRIiwiTC1Fd0pRTGQtMF9sU2lZNkYzVDNxNW5YOGVYUDdBR1JIY3p4ai1YMUhpayIsImtzVEtLeU13NmZuaFM3bW4weXpJN2U3VlNMYndPNWgxbEFXbTYtQlk3SkkiLCJ4bDZwZzBsUGU2QWJCUklHUlRxcnBfTzlQX0JMekF3LWx0dzRiMjFVWi1BIl19LCJpc3N1YW5jZURhdGUiOiIyMDIzLTEwLTI3VDA3OjAxOjMwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3NjaGVtYXMvZTZmZWVjNjgtNDYxNy00ZDBmLWE4YjgtZGZjNDQyMzg3Yzk1LzEuMC4wL3NjaGVtYS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImV4cGlyYXRpb25EYXRlIjoiMjAyMy0xMC0yNFQxNDowMDowMFoiLCJjcmVkZW50aWFsU3RhdHVzIjp7ImlkIjoiaHR0cHM6Ly9hcGktZGV2LnN2eC5leGNoYW5nZS9zdGF0dXNfbGlzdC8xIzE4NyIsInR5cGUiOiJTdGF0dXNMaXN0MjAyMUVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOjE4Nywic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRwczovL2FwaS1kZXYuc3Z4LmV4Y2hhbmdlL3N0YXR1c19saXN0LzEifX0sIl9zZF9hbGciOiJzaGEtMjU2In0.w2tzz2Dxbrjs-NCdfxPLPBRNnMs0pdIexotFnTJJdVlykqlEzdbag3wj0ScP9W4q-MaWVIMEO2-dLa7BdS8fVA~WyJHOHhxdXZpSXNaSGhDdlpyIiwiaWQiLCJkaWQ6a2V5Ono2TWt1UFdienAxYVFqUEFGaHBWa2VuZmFndWdYRFl4dG91MlN0YVNiWVVtVHVoVSJd~WyJ4VllhUGhkbEpnWTdlNjU2IiwiZ2l2ZW5OYW1lIiwiamFtZXMiXQ~WyJYMjB5cEhPWThuTWNSdFVjIiwiZmFtaWx5TmFtZSIsInNtaXRoIl0~WyJ5Z0Q1QmpLeHVFZEtEek12IiwiZGF0ZU9mQmlydGgiLCIyMDIzLTEwLTI3Il0~WyJIejZrS1E1M0Z3TnV5R29pIiwic3R1ZGVudElEIiwiMDAwMTI',
            metadata: {
              style: {
                background: 'linear-gradient(135deg, #9900EF, #ffffff 200%)',
                image: 'https://vc.meeco.me/image.png',
                text_color: '#FFF',
              },
            },
          });
        });
    });
  });

  describe('VC Vault Item', () => {
    let credentialService: CredentialService;

    beforeEach(() => {
      credentialService = new CredentialService(environment);
    });

    describe('createVerifiableCredentialItem', () => {
      customTest
        .stub(
          ItemService.prototype,
          'create',
          sinon.stub().returns(Promise.resolve({} as DecryptedItem))
        )
        .it('should create a verifiable credential item for format vc+sd-jwt', async () => {
          const credential =
            'eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFZDI1NTE5Iiwia2lkIjoiZGlkOndlYjpkaWQtd2ViLnNlY3VyZXZhbHVlLmV4Y2hhbmdlOjAyOTc4ZWYxLThmZWEtNDZlZS04MmU3LTZhYjZlOTZkMTYzMyNrZXktMSJ9.eyJpYXQiOjE3MDUzNzgyNzYsImNuZiI6eyJqd2siOnsia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsIngiOiJqalBqc0hPaTNlSl9SeTBwYUtla2ozSHhleFJiNDNVWURWOGZJNjNEWEYwIiwieSI6Iic5X1VZNDZKN3lVN3E4amRNN3B4MEg2NVp2YWFNb281Z2J0MzVFYVFpMW9nIn19LCJpc3MiOiJkaWQ6d2ViOmRpZC13ZWIuc2VjdXJldmFsdWUuZXhjaGFuZ2U6MDI5NzhlZjEtOGZlYS00NmVlLTgyZTctNmFiNmU5NmQxNjMzIiwidmN0IjoiU3R1ZGVudElEIiwianRpIjoidXJuOnV1aWQ6NjZjZmRlMGEtYmFjOS00ZWQzLThjZWUtMTBlNGE0MTdkY2M5IiwiX3NkIjpbIk1JaWhjaDJacVdlU1FraEtGdDhiWmRid3RhZzRjNWZVdUdvU2lDSmswNVUiLCJULU4xNFpGVHpzcWtPWVI2ZXNaVjZIMUJRT20zMFJTcFRPQ01JY0FWVEtzIiwiZ3RnOHllSmpfT2ZwbE43eTZva3k4MXdkOUFCOUdPVU51Sk05ODgwWjVxWSIsImlPUWZaSTNRRU9hcHhNZnk3YnlkV3R2VWlWR01zTkxYa3d3YmJFaXpvUU0iXSwiX3NkX2FsZyI6InNoYS0yNTYifQ.M5GJO0y1ohtpeMhuOQOLNN_dNz2Wo1Ur4M5-NsbhKlIiGFTzDFZw3C3eLqilnR9l2PnB9xJTyp4u6GPVdYZeDw~WyJIMDlneWlFUnlxeWJCRWp3IiwiZ2l2ZW5OYW1lIiwiSm9obiJd~WyJKeEZPZmhMcTJFZ2ZSQWNkIiwiZmFtaWx5TmFtZSIsIkRvZSJd~';

          await credentialService.createVerifiableCredentialItem(
            {
              vault_access_token: testUserAuth.vault_access_token,
              data_encryption_key: testUserAuth.data_encryption_key,
            },
            {
              credential,
              format: 'vc+sd-jwt',
              id: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
              credentialDetail: {
                issuer: 'did:web:did-web.securevalue.exchange:02978ef1-8fea-46ee-82e7-6ab6e96d1633',
                subject: undefined,
                issuanceDate: new Date('1970-01-20T17:42:58.276Z'),
                expirationDate: undefined,
                id: 'urn:uuid:66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
                credentialSchema: undefined,
                revocable: undefined,
              },
            }
          );

          const itemServiceAuth = {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          };

          const expectedItem = {
            slots: [
              {
                slot_type_name: 'key_value',
                label: 'Credential',
                name: 'credential_jwt',
                value: credential,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential format',
                name: 'credential_format',
                value: 'vc+sd-jwt',
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer',
                name: 'issuer',
                value: 'did:web:did-web.securevalue.exchange:02978ef1-8fea-46ee-82e7-6ab6e96d1633',
              },
              {
                slot_type_name: 'key_value',
                label: 'Subject',
                name: 'subject',
                value: null,
              },
              {
                slot_type_name: 'datetime',
                label: 'Issued at',
                name: 'issued_at',
                value: '1970-01-20T17:42:58.276Z',
              },
              {
                slot_type_name: 'datetime',
                label: 'Expires at',
                name: 'expires_at',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential ID',
                name: 'credential_id',
                value: 'urn:uuid:66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
              },
              {
                slot_type_name: 'key_value',
                label: 'Schema url',
                name: 'schema_url',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type id',
                name: 'credential_type_id',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type name',
                name: 'credential_type_name',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Styles',
                name: 'styles',
                value: null,
              },
              {
                slot_type_name: 'bool',
                label: 'Revocable',
                name: 'revocable',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer name',
                name: 'issuer_name',
                value: null,
              },
            ],
            classification_nodes: [],
            label: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
            template_name: 'verifiable_credential',
            name: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
          };
          sinon.assert.calledWith(
            ItemService.prototype.create as sinon.SinonStub,
            itemServiceAuth,
            sinon.match(expectedItem)
          );
        });

      customTest
        .stub(
          ItemService.prototype,
          'create',
          sinon.stub().returns(Promise.resolve({} as DecryptedItem))
        )
        .it('should create a verifiable credential item for format jwt_vc_json', async () => {
          const credential =
            'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sImlkIjoiaHR0cDovL2V4YW1wbGUuZWR1L2NyZWRlbnRpYWxzLzM3MzIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVW5pdmVyc2l0eURlZ3JlZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiaHR0cHM6Ly9leGFtcGxlLmVkdS9pc3N1ZXJzLzU2NTA0OSIsImlzc3VhbmNlRGF0ZSI6IjIwMTAtMDEtMDFUMDA6MDA6MDBaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZXhhbXBsZTplYmZlYjFmNzEyZWJjNmYxYzI3NmUxMmVjMjEiLCJkZWdyZWUiOnsidHlwZSI6IkJhY2hlbG9yRGVncmVlIiwibmFtZSI6IkJhY2hlbG9yIG9mIFNjaWVuY2UgYW5kIEFydHMifX19LCJpc3MiOiJodHRwczovL2V4YW1wbGUuZWR1L2lzc3VlcnMvNTY1MDQ5IiwibmJmIjoxMjYyMzA0MDAwLCJqdGkiOiJodHRwOi8vZXhhbXBsZS5lZHUvY3JlZGVudGlhbHMvMzczMiIsInN1YiI6ImRpZDpleGFtcGxlOmViZmViMWY3MTJlYmM2ZjFjMjc2ZTEyZWMyMSJ9.z5vgMTK1nfizNCg5N-niCOL3WUIAL7nXy-nGhDZYO_-PNGeE-0djCpWAMH8fD8eWSID5PfkPBYkx_dfLJnQ7NA';

          await credentialService.createVerifiableCredentialItem(
            {
              vault_access_token: testUserAuth.vault_access_token,
              data_encryption_key: testUserAuth.data_encryption_key,
            },
            {
              credential,
              format: 'jwt_vc_json',
              id: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
              credentialDetail: {
                issuer: 'https://example.edu/issuers/565049',
                subject: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
                issuanceDate: new Date('2010-01-01T00:00:00Z'),
                id: 'http://example.edu/credentials/3732',
              },
            }
          );

          const itemServiceAuth = {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          };

          const expectedItem = {
            slots: [
              {
                slot_type_name: 'key_value',
                label: 'Credential',
                name: 'credential_jwt',
                value: credential,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential format',
                name: 'credential_format',
                value: 'jwt_vc_json',
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer',
                name: 'issuer',
                value: 'https://example.edu/issuers/565049',
              },
              {
                slot_type_name: 'key_value',
                label: 'Subject',
                name: 'subject',
                value: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
              },
              {
                slot_type_name: 'datetime',
                label: 'Issued at',
                name: 'issued_at',
                value: '2010-01-01T00:00:00.000Z',
              },
              {
                slot_type_name: 'datetime',
                label: 'Expires at',
                name: 'expires_at',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential ID',
                name: 'credential_id',
                value: 'http://example.edu/credentials/3732',
              },
              {
                slot_type_name: 'key_value',
                label: 'Schema url',
                name: 'schema_url',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type id',
                name: 'credential_type_id',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type name',
                name: 'credential_type_name',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Styles',
                name: 'styles',
                value: null,
              },
              {
                slot_type_name: 'bool',
                label: 'Revocable',
                name: 'revocable',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer name',
                name: 'issuer_name',
                value: null,
              },
            ],
            classification_nodes: [],
            label: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
            template_name: 'verifiable_credential',
            name: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
          };
          sinon.assert.calledWith(
            ItemService.prototype.create as sinon.SinonStub,
            itemServiceAuth,
            sinon.match(expectedItem)
          );
        });

      customTest
        .stub(
          ItemService.prototype,
          'create',
          sinon.stub().returns(Promise.resolve({} as DecryptedItem))
        )
        .it('should create a verifiable credential item for format ldp_vc', async () => {
          const credential =
            '{"@context":["https://www.w3.org/2018/credentials/v1","https://www.w3.org/2018/credentials/examples/v1"],"id":"http://example.edu/credentials/3732","type":["VerifiableCredential","UniversityDegreeCredential"],"issuer":"https://example.edu/issuers/565049","issuanceDate":"2010-01-01T00:00:00Z","credentialSubject":{"id":"did:example:ebfeb1f712ebc6f1c276e12ec21","degree":{"type":"BachelorDegree","name":"Bachelor of Science and Arts"}},"proof":{"type":"Ed25519Signature2020","created":"2022-02-25T14:58:43Z","verificationMethod":"https://example.edu/issuers/565049#key-1","proofPurpose":"assertionMethod","proofValue":"zeEdUoM7m9cY8ZyTpey83yBKeBcmcvbyrEQzJ19rD2UXArU2U1jPGoEtrRvGYppdiK37GU4NBeoPakxpWhAvsVSt"}}';

          await credentialService.createVerifiableCredentialItem(
            {
              vault_access_token: testUserAuth.vault_access_token,
              data_encryption_key: testUserAuth.data_encryption_key,
            },
            {
              credential,
              format: 'ldp_vc',
              id: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
              credentialDetail: {
                issuer: 'https://example.edu/issuers/565049',
                subject: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
                issuanceDate: new Date('2010-01-01T00:00:00Z'),
                id: 'http://example.edu/credentials/3732',
              },
            }
          );

          const itemServiceAuth = {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          };

          const expectedItem = {
            slots: [
              {
                slot_type_name: 'key_value',
                label: 'Credential',
                name: 'credential_jwt',
                value: credential,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential format',
                name: 'credential_format',
                value: 'ldp_vc',
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer',
                name: 'issuer',
                value: 'https://example.edu/issuers/565049',
              },
              {
                slot_type_name: 'key_value',
                label: 'Subject',
                name: 'subject',
                value: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
              },
              {
                slot_type_name: 'datetime',
                label: 'Issued at',
                name: 'issued_at',
                value: '2010-01-01T00:00:00.000Z',
              },
              {
                slot_type_name: 'datetime',
                label: 'Expires at',
                name: 'expires_at',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential ID',
                name: 'credential_id',
                value: 'http://example.edu/credentials/3732',
              },
              {
                slot_type_name: 'key_value',
                label: 'Schema url',
                name: 'schema_url',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type id',
                name: 'credential_type_id',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Credential type name',
                name: 'credential_type_name',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Styles',
                name: 'styles',
                value: null,
              },
              {
                slot_type_name: 'bool',
                label: 'Revocable',
                name: 'revocable',
                value: null,
              },
              {
                slot_type_name: 'key_value',
                label: 'Issuer name',
                name: 'issuer_name',
                value: null,
              },
            ],
            classification_nodes: [],
            label: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
            template_name: 'verifiable_credential',
            name: '66cfde0a-bac9-4ed3-8cee-10e4a417dcc9',
          };
          sinon.assert.calledWith(
            ItemService.prototype.create as sinon.SinonStub,
            itemServiceAuth,
            sinon.match(expectedItem)
          );
        });
    });

    describe('findVerifiableCredentialItemsById', () => {
      customTest
        .stub(
          ItemService.prototype,
          'listDecrypted',
          sinon.stub().returns(Promise.resolve({} as DecryptedItems))
        )
        .it('should find verifiable credential items by id', async () => {
          const mockCredentialId = 'urn:uuid:58864fac-1857-40f8-9f37-8fdd4fe1cc2e';

          await credentialService.findVerifiableCredentialItemsById(
            {
              vault_access_token: testUserAuth.vault_access_token,
              data_encryption_key: testUserAuth.data_encryption_key,
            },
            mockCredentialId
          );

          const itemServiceAuth = {
            vault_access_token: testUserAuth.vault_access_token,
            data_encryption_key: testUserAuth.data_encryption_key,
          };

          const expectedQuery = {
            name: '58864fac-1857-40f8-9f37-8fdd4fe1cc2e',
          };

          sinon.assert.calledWith(
            ItemService.prototype.listDecrypted as sinon.SinonStub,
            itemServiceAuth,
            expectedQuery
          );
        });
    });
  });
});

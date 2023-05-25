import { SigningAlg, signUnsignedJWT } from '@meeco/sdk';
import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { expect } from 'chai';
import { decodeJWT, hexToBytes } from 'did-jwt';

describe('#signUnsignedJWT', () => {
  describe('EdDSA', () => {
    it('signs self issued id_token', async () => {
      const key = generateKeyPairFromSeed(
        hexToBytes('9d99ba973c73fd9b6697a7c0ede97429c9100e6a9c5d524930c8747b5df75345')
      ).secretKey;

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLI3o2TWtnOXBKNGdaVnRXM2ZqTkRTYU5vbTh2a0dhUmZwV2o0Y05hRDZHdnZXTkczSyIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NzQwMDE2NjUsInN1YiI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLIiwiYXVkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6Imh0dHBzOi8vc2VsZi1pc3N1ZWQubWUvdjIvb3BlbmlkLXZjIiwibm9uY2UiOiJ3dTAxMWg4a20yIiwiX3ZwX3Rva2VuIjp7InByZXNlbnRhdGlvbl9zdWJtaXNzaW9uIjp7ImRlc2NyaXB0b3JfbWFwIjpbeyJwYXRoIjoiJCIsImZvcm1hdCI6Imp3dF92cCIsInBhdGhfbmVzdGVkIjp7InBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsWzBdIiwiZm9ybWF0Ijoiand0X3ZjIiwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifSwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifV0sImRlZmluaXRpb25faWQiOiJhMTc2NmExOC0zNTM0LTRiNjUtYTJjNi1lOGRhYzZjYjJiNDMiLCJpZCI6ImZlMjRmZTEyLTE2Y2EtNGZkMC1iYmIxLTUxNTZkOThjMmMxZSJ9fX0';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const SELF_ISSUED_V2_VC_INTEROP = 'https://self-issued.me/v2/openid-vc';
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.EdDSA
      );

      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.EdDSA);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(SELF_ISSUED_V2_VC_INTEROP);
    });

    it('signs vp_token', async () => {
      const key = generateKeyPairFromSeed(
        hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484')
      ).secretKey;

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.EdDSA
      );

      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.EdDSA);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss);
    });

    /**
     * TODO: VS - find out how issuer name can be added to vp_token unsignedJWT -
     * could be added as custom claim https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#custom-claims
     */
    it('signs vp_token and sets issuer as an object', async () => {
      const key = generateKeyPairFromSeed(
        hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484')
      ).secretKey;

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.EdDSA
      );

      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.EdDSA);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss!);
    });
  });

  describe('ES256K', () => {
    it('signs self issued id_token', async () => {
      const key = hexToBytes('9d99ba973c73fd9b6697a7c0ede97429c9100e6a9c5d524930c8747b5df75345');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLI3o2TWtnOXBKNGdaVnRXM2ZqTkRTYU5vbTh2a0dhUmZwV2o0Y05hRDZHdnZXTkczSyIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NzQwMDE2NjUsInN1YiI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLIiwiYXVkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6Imh0dHBzOi8vc2VsZi1pc3N1ZWQubWUvdjIvb3BlbmlkLXZjIiwibm9uY2UiOiJ3dTAxMWg4a20yIiwiX3ZwX3Rva2VuIjp7InByZXNlbnRhdGlvbl9zdWJtaXNzaW9uIjp7ImRlc2NyaXB0b3JfbWFwIjpbeyJwYXRoIjoiJCIsImZvcm1hdCI6Imp3dF92cCIsInBhdGhfbmVzdGVkIjp7InBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsWzBdIiwiZm9ybWF0Ijoiand0X3ZjIiwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifSwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifV0sImRlZmluaXRpb25faWQiOiJhMTc2NmExOC0zNTM0LTRiNjUtYTJjNi1lOGRhYzZjYjJiNDMiLCJpZCI6ImZlMjRmZTEyLTE2Y2EtNGZkMC1iYmIxLTUxNTZkOThjMmMxZSJ9fX0';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const SELF_ISSUED_V2_VC_INTEROP = 'https://self-issued.me/v2/openid-vc';
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256K
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256K);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(SELF_ISSUED_V2_VC_INTEROP);
    });

    it('signs vp_token', async () => {
      const key = hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256K
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256K);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss);
    });

    // /**
    //  * TODO: VS - find out how issuer name can be added to vp_token unsignedJWT -
    //  * could be added as custom claim https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#custom-claims
    //  */
    it('signs vp_token and sets issuer as an object', async () => {
      const key = hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256K
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256K);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss!);
    });
  });

  describe('ES256', () => {
    it('signs self issued id_token', async () => {
      const key = hexToBytes('9d99ba973c73fd9b6697a7c0ede97429c9100e6a9c5d524930c8747b5df75345');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLI3o2TWtnOXBKNGdaVnRXM2ZqTkRTYU5vbTh2a0dhUmZwV2o0Y05hRDZHdnZXTkczSyIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NzQwMDE2NjUsInN1YiI6ImRpZDprZXk6ejZNa2c5cEo0Z1pWdFczZmpORFNhTm9tOHZrR2FSZnBXajRjTmFENkd2dldORzNLIiwiYXVkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6Imh0dHBzOi8vc2VsZi1pc3N1ZWQubWUvdjIvb3BlbmlkLXZjIiwibm9uY2UiOiJ3dTAxMWg4a20yIiwiX3ZwX3Rva2VuIjp7InByZXNlbnRhdGlvbl9zdWJtaXNzaW9uIjp7ImRlc2NyaXB0b3JfbWFwIjpbeyJwYXRoIjoiJCIsImZvcm1hdCI6Imp3dF92cCIsInBhdGhfbmVzdGVkIjp7InBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsWzBdIiwiZm9ybWF0Ijoiand0X3ZjIiwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifSwiaWQiOiJlZGMxMDY2Ni1jOGZjLTQwOGYtYmM5MS1lMGY3NDQ2NDg0YmQifV0sImRlZmluaXRpb25faWQiOiJhMTc2NmExOC0zNTM0LTRiNjUtYTJjNi1lOGRhYzZjYjJiNDMiLCJpZCI6ImZlMjRmZTEyLTE2Y2EtNGZkMC1iYmIxLTUxNTZkOThjMmMxZSJ9fX0';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const SELF_ISSUED_V2_VC_INTEROP = 'https://self-issued.me/v2/openid-vc';
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(SELF_ISSUED_V2_VC_INTEROP);
    });

    it('signs vp_token', async () => {
      const key = hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss);
    });

    // /**
    //  * TODO: VS - find out how issuer name can be added to vp_token unsignedJWT -
    //  * could be added as custom claim https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#custom-claims
    //  */
    it('signs vp_token and sets issuer as an object', async () => {
      const key = hexToBytes('1fb93b9ea823629edbab4df4a2cdef9fea5510e367db839cdb7c827e16507484');

      const unsignedJWT =
        'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQja2V5LTEiLCJ0eXAiOiJKV1QifQ.eyJjbGFpbXMiOnsidnBfdG9rZW4iOnsicHJlc2VudGF0aW9uX2RlZmluaXRpb24iOnsiaWQiOiIwMjhhYmM5Zi1mOTAyLTRlNTEtYTRmZi01NGQwYzYwMDk4NzIiLCJpbnB1dF9kZXNjcmlwdG9ycyI6W3siaWQiOiJjODYzZTk2ZC0zODk1LTQxYjMtYjhlNy1hMDY3ZGFmMjIxY2UiLCJzY2hlbWEiOlt7InVyaSI6Imh0dHBzOi8vdmMtZGV2Lm1lZWNvLm1lL3NjaGVtYXMvYTJiNTBmOTItY2FmMS00ODJlLWFjOTYtMmQxN2NlNGNjNGEwLzEuMC4wL3NjaGVtYS5qc29uIn1dfV0sIm5hbWUiOiJwZXJzb24gdmVyaWZpY2F0aW9uIiwicHVycG9zZSI6InZlcmlmeSBwZXJzb24gbmFtZSBhbmQgYWdlIn19fSwiY2xpZW50X2lkIjoiZGlkOndlYjpkaWQtd2ViLmdvZGlkZHkuY29tOjRhOWIxZWE5LWNiYTMtNGViYS04MWExLWRlNjBkYTEyNTBkZCIsImlzcyI6ImRpZDp3ZWI6ZGlkLXdlYi5nb2RpZGR5LmNvbTo0YTliMWVhOS1jYmEzLTRlYmEtODFhMS1kZTYwZGExMjUwZGQiLCJub25jZSI6IjdrdG8yM25pZzQiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL3ZjLWRldi5tZWVjby5tZS9vaWRjL3ByZXNlbnRhdGlvbnMvcmVxdWVzdHMvNDcyZjA4YWEtNjExMC00YmY2LWE1ZmItYjhiMGNhZjEyNWE1L3N1Ym1pc3Npb25zIiwicmVnaXN0cmF0aW9uIjp7ImNsaWVudF9uYW1lIjoidmlqYXkgb3JnIiwiY2xpZW50X3B1cnBvc2UiOiIiLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDprZXkiXSwidnBfZm9ybWF0cyI6eyJqd3RfdmMiOnsiYWxnIjpbIkVkRFNBIl19LCJqd3RfdnAiOnsiYWxnIjpbIkVkRFNBIl19fX0sInJlc3BvbnNlX21vZGUiOiJwb3N0IiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQifQ';
      const decodedUnsignedJWT = decodeJWT(unsignedJWT + '.unsigned');
      const result = await signUnsignedJWT(
        unsignedJWT,
        decodedUnsignedJWT.payload.iss!,
        key,
        SigningAlg.ES256
      );
      const decodedSignedJWT = decodeJWT(result);

      expect(decodedSignedJWT.header.alg).to.eql(SigningAlg.ES256);
      expect(decodedSignedJWT.signature).to.be.a('string');
      expect(decodedSignedJWT.payload.iss).to.eql(decodedUnsignedJWT.payload.iss!);
    });
  });
});

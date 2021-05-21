import { Session, SrpChallenge } from '@meeco/keystore-api-sdk';
import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, environment, getOutputFixture } from '../test-helpers';

describe('UserService.getAuthData', () => {
  customTest
    .nock('https://sandbox.meeco.me/keystore', stubKeystore)
    .nock('https://sandbox.meeco.me/vault', stubVault)
    .mockCryppo()
    .mockSRP()
    .it('retrieves all user details with credentials (secret, password)', async () => {
      const user = await new UserService(environment).getAuthData(
        '123.asupersecretpassphrase',
        '1.user-1.my_secret_key'
      );

      const expected = getOutputFixture('get-user.output.json');
      expect(JSON.stringify(user)).to.contain(JSON.stringify(expected));
    });
});

function stubKeystore(api) {
  api
    .post('/srp/challenges', {
      srp_a: '000000000CLIENTPUBLIC',
      username: 'user-1',
    })
    .reply(200, {
      challenge: <SrpChallenge>{
        challenge_b: '00SERVERPUBLIC',
        challenge_salt: '00SALT',
      },
    });
  api
    .post('/srp/session', {
      srp_m: '00SALT:00SERVERPUBLIC:PROOF',
      srp_a: '000000000CLIENTPUBLIC',
      username: 'user-1',
    })
    .reply(200, {
      session: <Session>{
        session_authentication_string: 'keystore_auth_token',
      },
    });
  api
    .get('/key_encryption_key')
    .matchHeader('Authorization', 'keystore_auth_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      key_encryption_key: {
        serialized_key_encryption_key: `key_encryption_key`,
      },
    });
  api
    .get('/data_encryption_keys/data_encryption_key_id')
    .matchHeader('Authorization', 'keystore_auth_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      data_encryption_key: {
        serialized_data_encryption_key: `data_encryption_key`,
      },
    });
  api
    .get('/keypairs/external_id/auth')
    .matchHeader('Authorization', 'keystore_auth_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      keypair: {
        public_key: '-----BEGIN PUBLIC KEY-----ABCD',
        encrypted_serialized_key: '-----BEGIN RSA PRIVATE KEY-----ABCD',
        external_identifiers: [UserService.VAULT_PAIR_EXTERNAL_IDENTIFIER],
      },
    });
}

function stubVault(api) {
  api
    .get('/me')
    .matchHeader(
      'Authorization',
      [
        '[decrypted]vault_auth_token-----BEGIN RSA PRIVATE KEY-----ABCD[decrypted with key_encryption_key[decrypted with derived_key_123.asupersecretpassphrase]]',
      ].join('')
    )
    .reply(200, {
      user: {
        id: 'vault_user',
        private_dek_external_id: 'data_encryption_key_id',
      },
    });
  api
    .post('/session', {
      public_key: '-----BEGIN PUBLIC KEY-----ABCD',
    })
    .reply(200, {
      session: {
        encrypted_session_authentication_string: 'vault_auth_token',
      },
    });
}

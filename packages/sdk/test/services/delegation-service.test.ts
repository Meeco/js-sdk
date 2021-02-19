import { DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('DelegationService', () => {
  const childConnectionIdentifier = 'external identifier';
  function postKeyPairAPI(keypair: { public_key: string; external_identifier: string[] }) {
    return api =>
      api
        .post('/keypairs', body =>
          body.encrypted_serialized_key.match(
            /^\[serialized\]\[encrypted\]-----BEGIN RSA PRIVATE KEY-----.*\[with my_key_encryption_key\]$/
          )
        )
        .matchHeader('Authorization', testUserAuth.keystore_access_token)
        .matchHeader('Meeco-Subscription-Key', environment.keystore.subscription_key)
        .reply(200, { keypair });
  }

  describe('#createChildUser', () => {
    const fakeToken = '123';

    function postVaultChildUserAPI() {
      return api =>
        api
          .post('/child_users')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, {
            user: { id: '31bc2137-4d59-4c5e-a352-0525ee2ac858' },
            connection_from_parent_to_child: {
              the_other_user: { integration_data: { delegation_token: fakeToken } },
            },
          });
    }

    function postKeystoreChildUserAPI() {
      return api =>
        api
          .post('/child_users', body => body.delegation_token === fakeToken)
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.keystore.subscription_key)
          .reply(200, { delegation: { vault_account_owner_id: 'vault owner id' } });
    }

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({
          public_key: 'new_public_key',
          external_identifier: [childConnectionIdentifier],
        })
      )
      .nock('https://sandbox.meeco.me/vault', postVaultChildUserAPI())
      .nock('https://sandbox.meeco.me/keystore', postKeystoreChildUserAPI())
      .add('result', () =>
        new DelegationService(environment).createChildUser(testUserAuth, childConnectionIdentifier)
      )
      .it('creates a child user', ({ result }) => {
        expect(result.vault_account_owner_id).to.equal('vault owner id');
      });
  });
});

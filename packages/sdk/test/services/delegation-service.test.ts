import { bytesToBinaryString } from '@meeco/cryppo';
import { DecryptedKeypair, DelegationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { default as connectionResponse } from '../fixtures/responses/connection-response';
import { default as connectionResponseWithCreatedSharesReport } from '../fixtures/responses/connection-response-with-created-shares-report';
import { decryptedPrivateKey } from '../fixtures/responses/keypair-response';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('DelegationService', () => {
  const connectionName = 'name';
  const delegationConnectionResponse = connectionResponseWithCreatedSharesReport;
  delegationConnectionResponse.connection.the_other_user.integration_data = {
    delegation_token: 'd0b2519e-4b19-4d34-98f5-505ae44d18fe',
    intent: 'delegate',
    role: 'owner',
  };

  const delegationResponse = {
    delegation: {
      account_owner_kek: null,
      account_owner_kek_encrypted_with_connection_keypair: true,
      claimed_at: '2021-05-05T07:21:08.833Z',
      delegate_public_key:
        '-----BEGIN PUBLIC KEY-----\r\n' +
        'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnynGIQ2yF9MFOXKfAJ36\r\n' +
        'RiDWhh8bZ9faCud2eNiq3DBluwmYbOIMgepAmj870FLomgMQYCxAy/3UAWWULegB\r\n' +
        '07OEyCx7cKizgZHcJqhOTGIVqbvUedlaFoDiCvuqj5WNlEDXA6IXAyASeiFMHeOl\r\n' +
        'Qnfo+tixswtTnCm+8APp9AuIZWnzVPkHAd/nD990VozieO27Da1uVa1IDFg6Cgcw\r\n' +
        'YGpLKUr4lL1KjbklGu/J2i7dYLBxiqCO+iBT67qiL2hm1fgg/++RaG7cmShMF+P3\r\n' +
        '0tQBn8YeMtvJNH+dZTaUy4GEBllX1qaObk1WslSvon6SgpSGOTy1uzXbfIHG7XBt\r\n' +
        'BlKzkd8MUcjdf1ktY3mKfGffMAUQQhXSmSBKK/2MHXERULCBY0ayae5a37CK4/3C\r\n' +
        'GtmSUYZgTz6qQb1PEB0OG1Tv84A01zjX7OJtFve0W64BBM1u+FWuXkjykO+PoBwf\r\n' +
        'vpzPt9xwX6y5l5AsyfnkRY9WeVdYPBTeOZTOM3E+loMf4EFmv8AHMJBFA7ER4zU5\r\n' +
        'TnDP54PeMW7NcCbZRlHl5Rq4cXwlYFB89dXiWMrw4IvYG6Dhg1g7Gnc76UayZPUm\r\n' +
        'a8dGTaT7Ut56ehnaG4xr0L1vCu5wn9qaKIOa9MzQFdd4qX8ZQv+BTRnygalUSuIg\r\n' +
        'Q3Tx1wRTFKR0R+hXEm4dnjcCAwEAAQ==\r\n' +
        '-----END PUBLIC KEY-----\r\n',
      delegate_signature:
        'Sign.Rsa4096.kfzJS8rFMErNUHWphPkHm53evxELEHp3VeoeFw1p_cCrimjhPsQkfgxAXQ74al8KUVnYI3BHMz2FerPI1zGHUgDbkUuYR5fRiyTDR2-kOcAyPR4Nq3IxbepgUg-Y4o6JP6iycaLp6rFOJOOY8jSQ0gSdxWWf_l8zidscwjxoQd1P-cX1x7MLNL6cSLoiOHiocMDZsMHkDxdZ82lIeCK3RkQlG1juY0zyru4LCuoxGmzDTTCBf05fjKwy3DchwnpFJVWcOn-rb3jtMH-PJZg04_BradBgum8tr4RNBxDRooTHy-HPHFN4w2vzbwT0J06D7fp2ZRJrUf0fHT70i82DC12UswpvY6f-IhVZNlj8-ziSFn-LVxSwyTlpw67Yz-XMiJlADXxQCo0VgcedudW5czBUy4D1bK2495-Fl9cUUxrxUEcZRUyO1-RWFbga4uKszYl9PBo4MIPQ3r1KHIB4FtC1BQyhR-X-CuPJ9Zy4N8kwfKUGYxPkPfR12St78Bp-hOq2sQ7PqFsDlkNb9nXfWFH6mYlgSAyX39W6Lwfusub6G8uRLIdohhZHEqQA2iluLneg3fAWx9XLHryIxwA7n343MFJAMmqnZTIxrDpCuHI3O9XC-lpydOeDifHZtuyieOD_99ZIz5R27UqSfcZ51tZ5krLXyGpG3jdAqt34ZcU=.ZDBiMjUxOWUtNGIxOS00ZDM0LTk4ZjUtNTA1YWU0NGQxOGZl',
      delegation_role: 'owner',
      delegation_token: 'd0b2519e-4b19-4d34-98f5-505ae44d18fe',
      expire_at: '2021-11-03T22:15:40.181Z',
      vault_account_owner_id: '0b07b423-5f5f-445f-8253-f6661327ecf5',
      verification_attempted_at: null,
      verified: false,
    },
  };

  function postKeyPairAPI(keypair: {
    id?: string;
    public_key: string;
    external_identifier?: string[];
  }) {
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

  function getKeyPairAPI(keypair: { id: string; public_key: string }) {
    return api =>
      api
        .get(`/keypairs/${keypair.id}`)
        .matchHeader('Authorization', testUserAuth.keystore_access_token)
        .matchHeader('Meeco-Subscription-Key', environment.keystore.subscription_key)
        .reply(200, { keypair });
  }

  const fromApi = (key, keypair) =>
    new DecryptedKeypair(connectionResponse.connection.own.user_public_key, decryptedPrivateKey);

  describe('#createChildUser', () => {
    const childConnectionIdentifier = 'external identifier';
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

  describe('#createDelegationInvitation', () => {
    function postInvitationAPI() {
      return api =>
        api
          .post('/invitations', body => {
            const ern = `[serialized][encrypted]${connectionName}[with ${bytesToBinaryString(
              testUserAuth.data_encryption_key.key
            )}]`;
            return (
              body.public_key.public_key === 'new_public_key' &&
              body.invitation.encrypted_recipient_name === ern
            );
          })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, {});
    }

    function postDelegationsAPI() {
      return api =>
        api
          .post(
            `/delegations`,
            body =>
              body.vault_account_id === delegationResponse.delegation.vault_account_owner_id &&
              body.delegation_role === delegationResponse.delegation.delegation_role
          )
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse);
    }

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({
          id: connectionResponse.connection.own.user_keypair_external_id!,
          public_key: 'new_public_key',
        })
      )
      .nock('https://sandbox.meeco.me/vault', postInvitationAPI())
      .nock('https://sandbox.meeco.me/keystore', postDelegationsAPI())
      .do(() =>
        new DelegationService(environment).createDelegationInvitation(
          testUserAuth,
          delegationResponse.delegation.vault_account_owner_id,
          delegationResponse.delegation.delegation_role,
          connectionName
        )
      )
      .it('accepts an invitation creating a new keypair');
  });

  describe('#claimDelegationInvitation', () => {
    const token = '123';

    function postConnectionAPI() {
      return api =>
        api
          .post(
            '/connections',
            body =>
              body.public_key.public_key === connectionResponse.connection.own.user_public_key &&
              body.connection.encrypted_recipient_name ===
                `[serialized][encrypted]${connectionName}[with ${bytesToBinaryString(
                  testUserAuth.data_encryption_key.key
                )}]` &&
              body.connection.invitation_token === token
          )
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationConnectionResponse);
    }

    function postClaimDelegationAPI() {
      return api =>
        api
          .post(
            `/delegations/${delegationResponse.delegation.delegation_token}/claim`,
            body => body.delegate_signature === delegationResponse.delegation.delegate_signature
          )
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse);
    }

    customTest
      .mockCryppo()
      .stub(DecryptedKeypair, 'fromAPI', sinon.fake<any, any>(fromApi))
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({
          id: connectionResponse.connection.own.user_keypair_external_id!,
          public_key: connectionResponse.connection.own.user_public_key,
        })
      )
      .nock('https://sandbox.meeco.me/vault', postConnectionAPI())
      .nock(
        'https://sandbox.meeco.me/keystore',
        getKeyPairAPI({
          id: connectionResponse.connection.own.user_keypair_external_id!,
          public_key: connectionResponse.connection.own.user_public_key,
        })
      )
      .nock('https://sandbox.meeco.me/keystore', postClaimDelegationAPI())
      .do(() =>
        new DelegationService(environment).claimDelegationInvitation(
          testUserAuth,
          connectionName,
          token
        )
      )
      .it('accepts an invitation creating a new keypair');
  });

  describe('#shareKekWithDelegate', () => {
    function putShareDelegationKekAPI() {
      return api =>
        api
          .put(`/delegations/${delegationResponse.delegation.delegation_token}/share`)
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse);
    }
    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get(`/connections/${delegationConnectionResponse.connection.own.id}`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationConnectionResponse)
      )
      .nock('https://sandbox.meeco.me/keystore', putShareDelegationKekAPI())
      .do(() =>
        new DelegationService(environment).shareKekWithDelegate(
          testUserAuth,
          delegationConnectionResponse.connection.own.id
        )
      )
      .it('accepts an invitation creating a new keypair');
  });

  describe('#reencryptSharedKek', () => {
    function reencryptSharedKekAPI() {
      return api =>
        api
          .put(
            `/delegations/${delegationResponse.delegation.delegation_token}/reencrypt`,
            body => body.encrypted_kek === reencryptedKek
          )
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse);
    }

    customTest
      .mockCryppo()
      .stub(DecryptedKeypair, 'fromAPI', sinon.fake<any, any>(fromApi))
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get(`/connections/${delegationConnectionResponse.connection.own.id}`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationConnectionResponse)
      )
      .nock('https://sandbox.meeco.me/keystore', api =>
        api
          .get(`/delegations/${delegationResponse.delegation.delegation_token}`)
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse)
      )
      .nock(
        'https://sandbox.meeco.me/keystore',
        getKeyPairAPI({
          id: connectionResponse.connection.own.user_keypair_external_id!,
          public_key: connectionResponse.connection.own.user_public_key,
        })
      )
      .nock('https://sandbox.meeco.me/keystore', reencryptSharedKekAPI())
      .do(() =>
        new DelegationService(environment).reencryptSharedKek(
          testUserAuth,
          delegationConnectionResponse.connection.own.id
        )
      )
      .it('accepts an invitation creating a new keypair');
  });

  const reencryptedKek =
    '[serialized][encrypted][decrypted]null-----BEGIN RSA PRIVATE KEY-----\r\n' +
    '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\r\n' +
    '-----END RSA PRIVATE KEY-----\r\n' +
    '[with my_key_encryption_key]';
});

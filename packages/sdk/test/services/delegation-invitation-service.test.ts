import { DecryptedKeypair, DelegationInvitationService } from '@meeco/sdk';
import sinon from 'sinon';
import { default as connectionResponse } from '../fixtures/responses/connection-response';
import { default as connectionResponseWithCreatedSharesReport } from '../fixtures/responses/connection-response-with-created-shares-report';
import { decryptedPrivateKey } from '../fixtures/responses/keypair-response';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('DelegationInvitationService', () => {
  const connectionId = connectionResponse.connection.own.id;
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

  const delegationInvitationResponse = {
    delegation_invitation: {
      id: '8875a4cb-6bb9-4ecf-8003-0fbecc76d7d1',
      inviting_user_id: connectionResponse.connection.own.user_id,
      inviting_user_connection_id: connectionResponse.connection.own.id,
      invited_user_id: connectionResponse.connection.the_other_user.user_id,
      invited_user_connection_id: connectionResponse.connection.the_other_user.id,
      delegation_token: delegationResponse.delegation.delegation_token,
      delegation_role: delegationResponse.delegation.delegation_role,
      state: 'new',
    },
  };

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

  describe('#createDelegationUpgradeInvitation', () => {
    function postDelegationsAPI() {
      return api =>
        api
          .post(`/delegations`, body => {
            return (
              body.vault_account_id === delegationResponse.delegation.vault_account_owner_id &&
              body.delegation_role === delegationResponse.delegation.delegation_role
            );
          })
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, delegationResponse);
    }

    function postDelegationInvitationAPI() {
      return api =>
        api
          .post('/delegation_invitations', body => {
            return (
              body.connection_id === connectionId &&
              body.delegation_role === delegationResponse.delegation.delegation_role &&
              body.delegation_token === delegationResponse.delegation.delegation_token
            );
          })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(201, delegationInvitationResponse);
    }

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/keystore', postDelegationsAPI())
      .nock('https://sandbox.meeco.me/vault', postDelegationInvitationAPI())
      .do(() =>
        new DelegationInvitationService(environment).createDelegationUpgradeInvitation(
          testUserAuth,
          delegationResponse.delegation.vault_account_owner_id,
          delegationResponse.delegation.delegation_role,
          connectionId
        )
      )
      .it('accepts an invitation creating a new keypair');
  });

  describe('#acceptDelegationUpgradeInvitation', () => {
    function postAcceptDelegationInvitationAPI() {
      return api =>
        api
          .put(
            '/delegation_invitations/' +
              delegationInvitationResponse.delegation_invitation.id +
              '/accept'
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
      .stub(DecryptedKeypair, 'fromAPI', sinon.fake(fromApi))
      .nock(
        'https://sandbox.meeco.me/keystore',
        getKeyPairAPI({
          id: connectionResponse.connection.own.user_keypair_external_id!,
          public_key: connectionResponse.connection.own.user_public_key,
        })
      )
      .nock('https://sandbox.meeco.me/vault', postAcceptDelegationInvitationAPI())
      .nock('https://sandbox.meeco.me/keystore', postClaimDelegationAPI())
      .do(() =>
        new DelegationInvitationService(environment).acceptDelegationUpgradeInvitation(
          testUserAuth,
          delegationInvitationResponse.delegation_invitation.id
        )
      )
      .it('accepts an invitation creating a new keypair');
  });
});

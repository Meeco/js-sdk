import { bytesToBinaryString } from '@meeco/cryppo';
import { InvitationService } from '@meeco/sdk';
import { expect } from 'chai';
import { default as connectionResponse } from '../fixtures/responses/connection-response';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('InvitationService', () => {
  const connectionName = 'name';
  const savedKeyPairId = '123';

  function postKeyPairAPI(keypair: { id: string; public_key: string }) {
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
        .get(`/keypairs/${savedKeyPairId}`)
        .matchHeader('Authorization', testUserAuth.keystore_access_token)
        .matchHeader('Meeco-Subscription-Key', environment.keystore.subscription_key)
        .reply(200, { keypair: { id: savedKeyPairId, public_key: 'new_public_key' } });
  }

  describe('#create', () => {
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

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({ id: savedKeyPairId, public_key: 'new_public_key' })
      )
      .nock('https://sandbox.meeco.me/vault', postInvitationAPI())
      .do(() => new InvitationService(environment).create(testUserAuth, connectionName))
      .it('creates an invitation with a new keypair');

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        getKeyPairAPI({ id: savedKeyPairId, public_key: 'new_public_key' })
      )
      .nock('https://sandbox.meeco.me/vault', postInvitationAPI())
      .do(() =>
        new InvitationService(environment).create(testUserAuth, connectionName, savedKeyPairId)
      )
      .it('allows using an existing keypair');

    customTest
      .nock('https://sandbox.meeco.me/keystore', api =>
        api.get(`/keypairs/${savedKeyPairId}`).reply(404)
      )
      .do(() =>
        new InvitationService(environment).create(testUserAuth, connectionName, savedKeyPairId)
      )
      .catch(e => expect(e).to.be.ok)
      .it('throws an error if the specified keypair is not found');
  });

  describe('#accept', () => {
    const token = '123';

    function postConnectionAPI() {
      return api =>
        api
          .post(
            '/connections',
            body =>
              body.public_key.public_key === 'new_public_key' &&
              body.connection.encrypted_recipient_name ===
                `[serialized][encrypted]${connectionName}[with ${bytesToBinaryString(
                  testUserAuth.data_encryption_key.key
                )}]` &&
              body.connection.invitation_token === token
          )
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, connectionResponse);
    }

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({ id: savedKeyPairId, public_key: 'new_public_key' })
      )
      .nock('https://sandbox.meeco.me/vault', postConnectionAPI())
      .do(() => new InvitationService(environment).accept(testUserAuth, connectionName, token))
      .it('accepts an invitation creating a new keypair');

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        getKeyPairAPI({ id: savedKeyPairId, public_key: 'new_public_key' })
      )
      .nock('https://sandbox.meeco.me/vault', postConnectionAPI())
      .do(() =>
        new InvitationService(environment).accept(
          testUserAuth,
          connectionName,
          token,
          savedKeyPairId
        )
      )
      .it('uses an existing keypair');

    customTest
      .mockCryppo()
      .nock(
        'https://sandbox.meeco.me/keystore',
        postKeyPairAPI({ id: savedKeyPairId, public_key: 'new_public_key' })
      )
      .nock('https://sandbox.meeco.me/vault', api => api.post('/connections').reply(404))
      .do(() => new InvitationService(environment).accept(testUserAuth, connectionName, token))
      .catch(/.*/)
      .it('throws an error if token does not exist');
  });
});

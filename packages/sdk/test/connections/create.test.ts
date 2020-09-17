import { expect } from '@oclif/test';
import * as nock from 'nock';
import { ConnectionCreateData } from '../../src/models/connection-create-data';
import { ConnectionService } from '../../src/services/connection-service';
import {
  buildTestAuthData,
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
} from '../test-helpers';

describe('Connections create', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', stubVault)
    .nock('https://sandbox.meeco.me/keystore', stubKeystore)
    .it('creates a connection between two users', async () => {
      const input = getInputFixture('create-connection.input.json');
      const fromUser = buildTestAuthData({
        ...input.from,
      });
      const toUser = buildTestAuthData({
        ...input.to,
      });
      const connectionMetadata = {
        ...input,
      };
      const connectionConfig = new ConnectionCreateData(fromUser, toUser, connectionMetadata);
      const result = await new ConnectionService(environment).createConnection(connectionConfig);

      const expected = getOutputFixture('create-connection.output.json');
      expect(result.options.fromName).to.eql(expected.fromName);
      expect(result.options.toName).to.eql(expected.toName);
      expect(result.invitation.id).to.eql(expected.invitation_id);
      expect(result.fromUserConnection.own.id).to.eql(expected.from_user_connection_id);
      expect(result.toUserConnection.the_other_user.id).to.eql(expected.to_user_connection_id);
    });
});

function stubVault(api: nock.Scope) {
  api
    .post('/invitations', {
      public_key: {
        keypair_external_id: 'from_stored_keypair_id',
        public_key: '--PUBLIC_KEY--ABCD',
      },
      invitation: {
        encrypted_recipient_name: '[serialized][encrypted]TestTo[with from_data_encryption_key]',
      },
    })
    .reply(200, {
      invitation: {
        id: 'invitation_id',
        token: 'invitation_token',
      },
    });

  api
    .get('/connections')
    .matchHeader('Authorization', 'from_vault_access_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .once()
    .reply(404);

  api
    .get('/connections')
    .matchHeader('Authorization', 'from_vault_access_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .once()
    .reply(200, {
      connections: [
        {
          own: {
            id: 'connection_id',
            user_public_key: 'from_user_public',
          },
          the_other_user: {
            id: 'other_connection_id',
            user_public_key: 'to_user_public',
          },
        },
      ],
    });

  api
    .get('/connections')
    .matchHeader('Authorization', 'to_vault_access_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      connections: [
        {
          own: {
            id: 'connection_id',
            user_public_key: 'to_user_public',
          },
          the_other_user: {
            id: 'other_connection_id',
            user_public_key: 'from_user_public',
          },
        },
      ],
    });

  api
    .post('/connections', {
      public_key: { keypair_external_id: 'to_stored_keypair_id', public_key: '--PUBLIC_KEY--ABCD' },
      connection: {
        encrypted_recipient_name:
          '[serialized][encrypted]TestFrom[with to_data_encryption_key\u0000\u0000]',
        invitation_token: 'invitation_token',
      },
    })
    .reply(200, {
      connection: {
        id: 'connection_id',
      },
    });
}

function stubKeystore(api: nock.Scope) {
  api
    .post('/keypairs', {
      public_key: '--PUBLIC_KEY--ABCD',
      encrypted_serialized_key:
        '[serialized][encrypted]--PRIVATE_KEY--12324[with to_key_encryption_key]',
      metadata: {},
      external_identifiers: [],
    })
    .matchHeader('Authorization', 'to_keystore_access_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      keypair: {
        id: 'to_stored_keypair_id',
      },
    });

  api
    .post('/keypairs', {
      public_key: '--PUBLIC_KEY--ABCD',
      encrypted_serialized_key:
        '[serialized][encrypted]--PRIVATE_KEY--12324[with from_key_encryption_key]',
      metadata: {},
      external_identifiers: [],
    })
    .matchHeader('Authorization', 'from_keystore_access_token')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      keypair: {
        id: 'from_stored_keypair_id',
      },
    });
}

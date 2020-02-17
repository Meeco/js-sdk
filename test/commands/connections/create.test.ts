import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import * as nock from 'nock/types';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('connections:create', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://api-sandbox.meeco.me', stubVault)
    .nock('https://keystore-sandbox.meeco.me', stubKeystore)
    .run([
      'connections:create',
      ...testEnvironmentFile,
      '-c',
      inputFixture('create-connection.input.yaml')
    ])
    .it('creates a connection between two users', ctx => {
      const expected = readFileSync(outputFixture('create-connection.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function stubVault(api: nock.Scope) {
  api
    .post('/invitations', {
      public_key_id: 'from_public_key_id',
      encrypted_recipient_name: '[serialized][encrypted]TestTo[with from_data_encryption_key]'
    })
    .reply(200, {
      invitation: {
        id: 'invitation_id',
        token: 'invitation_token'
      }
    });

  api
    .get('/connections')
    .matchHeader('Authorization', 'from_vault_access_token')
    .reply(200, {
      connections: [
        {
          id: 'connection_id',
          other_user_public_key: 'to_user_public'
        }
      ]
    });

  api
    .get('/connections')
    .matchHeader('Authorization', 'to_vault_access_token')
    .reply(200, {
      connections: [
        {
          id: 'connection_id',
          other_user_public_key: 'from_user_public'
        }
      ]
    });

  api
    .post('/connections', {
      public_key_id: 'to_public_key_id',
      encrypted_recipient_name:
        '[serialized][encrypted]TestFrom[with to_data_encryption_key\u0000\u0000]',
      invitation_token: 'invitation_token'
    })
    .reply(200, {
      connection: {
        id: 'connection_id'
      }
    });

  api
    .post('/key_store/public_keys', {
      key_store_id: 'from_stored_keypair_id',
      encryption_strategy: 'Rsa4096',
      public_key: '--PUBLIC_KEY--ABCD'
    })
    .matchHeader('Authorization', 'from_vault_access_token')
    .reply(200, {
      public_key: {
        id: 'from_public_key_id'
      }
    });
  api
    .post('/key_store/public_keys', {
      key_store_id: 'to_stored_keypair_id',
      encryption_strategy: 'Rsa4096',
      public_key: '--PUBLIC_KEY--ABCD'
    })
    .matchHeader('Authorization', 'to_vault_access_token')
    .reply(200, {
      public_key: {
        id: 'to_public_key_id'
      }
    });
}

function stubKeystore(api: nock.Scope) {
  api
    .post('/keypairs', {
      public_key: '--PUBLIC_KEY--ABCD',
      encrypted_serialized_key:
        '[serialized][encrypted]--PRIVATE_KEY--12324[with to_key_encryption_key]',
      metadata: {},
      external_identifiers: []
    })
    .matchHeader('Authorization', 'to_keystore_access_token')
    .reply(200, {
      keypair: {
        id: 'to_stored_keypair_id'
      }
    });

  api
    .post('/keypairs', {
      public_key: '--PUBLIC_KEY--ABCD',
      encrypted_serialized_key:
        '[serialized][encrypted]--PRIVATE_KEY--12324[with from_key_encryption_key]',
      metadata: {},
      external_identifiers: []
    })
    .matchHeader('Authorization', 'from_keystore_access_token')
    .reply(200, {
      keypair: {
        id: 'from_stored_keypair_id'
      }
    });
}

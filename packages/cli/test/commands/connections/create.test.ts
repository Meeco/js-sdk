import { AuthData, ConnectionService, IConnectionMetadata } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, inputFixture, outputFixture, testEnvironmentFile } from '../../test-helpers';

describe('connections:create', () => {
  customTest
    .stdout()
    .stderr()
    .stub(ConnectionService.prototype, 'createConnection', createConnection as any)
    .run([
      'connections:create',
      ...testEnvironmentFile,
      '-c',
      inputFixture('create-connection.input.yaml'),
    ])
    .it('creates a connection between two users', ctx => {
      const expected = readFileSync(outputFixture('create-connection.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function createConnection(config: { to: AuthData; from: AuthData; options: IConnectionMetadata }) {
  return Promise.resolve({
    invitation: {
      id: 'invitation_id',
      token: 'invitation_token',
      encrypted_recipient_name: '[serialized][encrypted]TestTo[with from_data_encryption_key]',
    },
    fromUserConnection: {
      own: {
        id: 'connection_id',
        user_public_key: 'from_user_public',
        encrypted_recipient_name:
          '[serialized][encrypted]TestFrom[with to_data_encryption_key\u0000\u0000]',
      },
      the_other_user: {
        id: 'other_connection_id',
        user_public_key: 'to_user_public',
      },
    },
    toUserConnection: {
      own: {
        id: 'other_connection_id',
        user_public_key: 'to_user_public',
        encrypted_recipient_name:
          '[serialized][encrypted]TestFrom[with to_data_encryption_key\u0000\u0000]',
      },
      the_other_user: {
        id: 'connection_id',
        user_public_key: 'from_user_public',
      },
    },
    options: {
      toName: config.options.toName,
      fromName: config.options.fromName,
    },
  });
}

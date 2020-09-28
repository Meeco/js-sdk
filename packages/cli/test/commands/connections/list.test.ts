import { ConnectionService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('connections:list', () => {
  customTest
    .stub(ConnectionService.prototype, 'list', list as any)
    .stdout()
    .run(['connections:list', ...testUserAuth, ...testEnvironmentFile])
    .it('lists a users connections', ctx => {
      const expected = readFileSync(outputFixture('list-connections.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });

  customTest
    .stub(ConnectionService.prototype, 'listAll', listAll as any)
    .stdout()
    .run(['connections:list', ...testUserAuth, ...testEnvironmentFile, ...testGetAll])
    .it('lists all users connections when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-connections.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

const connections = [
  {
    recipient_name: 'Some Encrypted Name[decrypted with my_generated_dek]',
    connection: {
      own: {
        id: 'abc123',
        encrypted_recipient_name: 'Some Encrypted Name',
        integration_data: null,
        connection_type: null,
        user_image: null,
        user_type: null,
        user_public_key: null,
        user_keypair_external_id: null,
      },
      the_other_user: {
        id: 'abc345',
        connection_type: null,
        user_id: null,
        user_image: null,
        user_type: null,
        user_public_key: null,
        user_keypair_external_id: null,
      },
    },
  },
  {
    recipient_name: 'Some Encrypted Name[decrypted with my_generated_dek]',
    connection: {
      own: {
        id: 'def456',
        encrypted_recipient_name: 'Some Encrypted Name',
        integration_data: null,
        connection_type: null,
        user_image: null,
        user_type: null,
        user_public_key: null,
        user_keypair_external_id: null,
      },
      the_other_user: {
        id: 'def789',
        connection_type: null,
        user_id: null,
        user_image: null,
        user_type: null,
        user_public_key: null,
        user_keypair_external_id: null,
      },
    },
  },
];

function list() {
  return Promise.resolve(connections);
}

function listAll() {
  return Promise.resolve(connections);
}

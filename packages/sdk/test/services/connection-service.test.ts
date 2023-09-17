import { InvitationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import sinon from 'sinon';
import { ConnectionService } from '../../src/services/connection-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { default as connectionResponse } from '../fixtures/responses/connection-response';
import {
  buildTestAuthData,
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuth,
} from '../test-helpers';

describe('ConnectionService', () => {
  describe('#get', () => {
    let service: ConnectionService;
    beforeEach(() => {
      service = new ConnectionService(environment);
    });

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get('/connections/id')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, connectionResponse)
      )
      .add('result', () => service.get(testUserAuth, 'id'))
      .it('gets a connection');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => api.get('/connections/id').reply(404))
      .add('result', () => service.get(testUserAuth, 'id'))
      // TODO inspect the error
      .catch(e => expect(e).to.be.ok)
      .it('reports a missing connection');
  });

  describe('#createConnection', () => {
    customTest
      .mockCryppo()
      .stub(
        InvitationService.prototype,
        'create',
        sinon.stub().returns({
          id: 'invitation_id',
          token: 'invitation_token',
        })
      )
      .stub(InvitationService.prototype, 'accept', sinon.stub())
      .nock('https://sandbox.meeco.me/vault', stubVault)
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
        const connectionConfig = { from: fromUser, to: toUser, options: connectionMetadata };
        const result = await new ConnectionService(environment).createConnection(connectionConfig);

        const expected = getOutputFixture('create-connection.output.json');
        expect(result.options.fromName).to.eql(expected.fromName);
        expect(result.options.toName).to.eql(expected.toName);
        expect(result.invitation.id).to.eql(expected.invitation_id);
        expect(result.fromUserConnection.own.id).to.eql(expected.from_user_connection_id);
        expect(result.toUserConnection.the_other_user.id).to.eql(expected.to_user_connection_id);
      });
  });

  function stubVault(api: any) {
    api
      .get('/connections')
      .matchHeader('Authorization', 'from_vault_access_token')
      .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
      .once()
      .reply(200, { connections: [], meta: {} });

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
  }

  const connectionsResponse = {
    connections: [
      {
        own: {
          id: 'abc123',
          encrypted_recipient_name: 'Some Encrypted Name',
        },
        the_other_user: {
          id: 'abc345',
        },
      },
      {
        own: {
          id: 'def456',
          encrypted_recipient_name: 'Some Encrypted Name',
        },
        the_other_user: {
          id: 'def789',
        },
      },
    ],
    meta: {},
  };

  describe('#list', () => {
    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/connections')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, connectionsResponse);
      })
      .add('connections', () => new ConnectionService(environment).list(testUserAuth))
      .it('calls GET /connections');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get('/connections').reply(200, connectionsResponse);
      })
      .add('connections', () => new ConnectionService(environment).list(testUserAuth))
      .it('decrypts connection name', ({ connections }) => {
        for (const connection of connections) {
          expect(connection.recipient_name).to.match(/.+\[decrypted with my_generated_dek\]$/);
        }
      });

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/connections')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, { connections: [{ own: { encrypted_recipient_name: null } }], meta: {} });
      })
      .add('connections', () => new ConnectionService(environment).list(testUserAuth))
      .it(
        'handles connections with null encrypted_recipient_name',
        ({ connections }) =>
          expect(connections[0].connection.own.encrypted_recipient_name).to.be.null
      );
  });

  describe('#listAll', () => {
    const responsePart1 = {
      ...connectionResponse,
      connections: [connectionsResponse.connections[0]],
      next_page_after: MOCK_NEXT_PAGE_AFTER,
      meta: {
        order: 'asc',
      },
    };
    const responsePart2 = {
      ...connectionResponse,
      connections: [connectionsResponse.connections[1]],
      meta: {},
    };

    customTest
      .stdout()
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/connections')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, responsePart1)
          .get('/connections')
          .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, responsePart2);
      })
      .add('connections', () => new ConnectionService(environment).listAll(testUserAuth))
      .it('lists all users connections when paginated', ({ connections }) => {
        expect(connections.length).to.equal(2);
        for (const connection of connections) {
          expect(connection.recipient_name).to.match(/.+\[decrypted with my_generated_dek\]$/);
        }
      });
  });

  describe('#findConnectionBetween', () => {
    const fromUserAPI = api => {
      api
        .get('/connections')
        .matchHeader('Authorization', 'from_vault_access_token')
        .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
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
    };

    const toUserAPI = api => {
      api
        .get('/connections')
        .matchHeader('Authorization', 'to_vault_access_token')
        .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
        .once()
        .reply(200, {
          connections: [
            {
              own: {
                id: 'other_connection_id',
                user_public_key: 'to_user_public',
              },
              the_other_user: {
                id: 'connection_id',
                user_public_key: 'from_user_public',
              },
            },
          ],
        });
    };

    function emptyAPI(token: string) {
      return api => {
        api.get('/connections').matchHeader('Authorization', token).once().reply(200, {
          connections: [],
        });
      };
    }

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        fromUserAPI(api);
        toUserAPI(api);
      })
      .add('result', () =>
        new ConnectionService(environment).findConnectionBetween(
          { vault_access_token: 'from_vault_access_token' },
          { vault_access_token: 'to_vault_access_token' }
        )
      )
      .it('finds a connection', ({ result }) => {
        expect(result.fromUserConnection.the_other_user.user_public_key).to.equal(
          result.toUserConnection.own.user_public_key
        );
        expect(result.fromUserConnection.own.user_public_key).to.equal(
          result.toUserConnection.the_other_user.user_public_key
        );
      });

    it('finds a connection when there are many connections');

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api.get('/connections').once().reply(200, {
          connections: [],
        })
      )
      .add('result', () =>
        new ConnectionService(environment).findConnectionBetween(
          { vault_access_token: 'from_vault_access_token' },
          { vault_access_token: 'to_vault_access_token' }
        )
      )
      .catch('Users are not connected. Please set up a connection first.')
      .it('reports no connection');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        fromUserAPI(api);
        emptyAPI('to_vault_access_token')(api);
      })
      .add('result', () =>
        new ConnectionService(environment).findConnectionBetween(
          { vault_access_token: 'from_vault_access_token' },
          { vault_access_token: 'to_vault_access_token' }
        )
      )
      .catch('Users are not connected. Please set up a connection first.')
      .it('reports a partial connection');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        // fromUserAPI(api);
        emptyAPI('to_vault_access_token')(api);
      })
      .add('result', () =>
        new ConnectionService(environment).findConnectionBetween(
          { vault_access_token: 'to_vault_access_token' },
          { vault_access_token: 'from_vault_access_token' }
        )
      )
      .catch('Users are not connected. Please set up a connection first.')
      .it('reports a partial connection (reversed roles)');
  });
});

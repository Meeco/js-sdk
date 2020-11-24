import { expect } from 'chai';
import { ConnectionService } from '../../src/services/connection-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import {
  customTest,
  environment,
  getOutputFixture,
  replaceUndefinedWithNull,
  testUserAuth,
} from '../test-helpers';

describe('Connections list', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/connections')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, connectionResponse);
    })
    .it('lists a users connections using listConnections', async () => {
      const connections = await new ConnectionService(environment).listConnections(testUserAuth);

      const expected = getOutputFixture('list-connections.output.json');
      expect(replaceUndefinedWithNull(connections)).to.deep.members(expected);
    });

  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/connections')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, connectionResponse);
    })
    .it('lists a users connections', async () => {
      const connections = await new ConnectionService(environment).list(testUserAuth);

      const expected = getOutputFixture('list-connections.output.json');
      expect(replaceUndefinedWithNull(connections)).to.deep.members(expected);
    });

  customTest
    .stdout()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/connections')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/connections')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2);
    })
    .it('lists all users connections when paginated', async () => {
      const connections = await new ConnectionService(environment).listAll(testUserAuth);

      const expected = getOutputFixture('list-connections.output.json');
      expect(replaceUndefinedWithNull(connections)).to.deep.members(expected);
    });
});

const connectionResponse = {
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
  meta: [],
};

const responsePart1 = {
  ...connectionResponse,
  connections: [connectionResponse.connections[0]],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [
    {
      next_page_exists: true,
    },
  ],
};
const responsePart2 = {
  ...connectionResponse,
  connections: [connectionResponse.connections[1]],
  meta: [],
};

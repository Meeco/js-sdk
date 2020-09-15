import { expect } from 'chai';
import { ConnectionService } from '../../src/services/connection-service';
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
        .reply(200, {
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
        });
    })
    .it('lists a users connections', async () => {
      const connections = await new ConnectionService(environment).listConnections(testUserAuth);

      const expected = getOutputFixture('list-connections.output.yaml');
      expect(replaceUndefinedWithNull(connections)).to.deep.members(expected);
    });
});

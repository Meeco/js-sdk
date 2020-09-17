import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { MOCK_NEXT_PAGE_AFTER } from '../../../src/util/constants';
import {
  customTest,
  outputFixture,
  testEnvironmentFile,
  testGetAll,
  testUserAuth,
} from '../../test-helpers';

describe('connections:list', () => {
  customTest
    .stdout()
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
          meta: [],
        });
    })
    .run(['connections:list', ...testUserAuth, ...testEnvironmentFile])
    .it('lists a users connections', ctx => {
      const expected = readFileSync(outputFixture('list-connections.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });

  customTest
    .stdout()
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
          ],
          meta: [
            {
              per_page_from_params: true,
            },
            {
              order: 'item_templates.id asc',
            },
            {
              per_page: 1,
            },
            {
              pagination_cursor: false,
            },
            {
              filter_by_like: false,
            },
            {
              filter_by_classification: false,
            },
            {
              next_page_exists: true,
            },
            {
              records_count: 1,
            },
          ],
          next_page_after: MOCK_NEXT_PAGE_AFTER,
        })
        .get('/connections')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          connections: [
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
          meta: [
            {
              next_page_exists: false,
            },
          ],
        });
    })
    .run(['connections:list', ...testUserAuth, ...testEnvironmentFile, ...testGetAll])
    .it('lists all users connections when paginated', ctx => {
      const expected = readFileSync(outputFixture('list-connections.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

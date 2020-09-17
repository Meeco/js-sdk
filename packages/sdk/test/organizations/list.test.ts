import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { getAllPaged, reducePages } from '../../src/util/paged';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('Organizations list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(f => f.status === 'validated'),
          services: [],
        });
    })
    .it('shows a list of validated organizations', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsForVaultUsersApi.organizationsGet();

      const expected = getOutputFixture('list-organizations-validated.output.json');
      expect(result.organizations).to.deep.members(expected);
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .query({ mode: 'requested' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(f => f.status === 'requested'),
          services: [],
        });
    })
    .it('shows a list of requested organizations requested by logged in user ', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsForVaultUsersApi.organizationsGet('requested');

      const expected = getOutputFixture('list-organizations-requested.output.json');
      expect(result.organizations).to.eql(expected);
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .query({ mode: 'member' })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, {
          organizations: response.organizations.filter(
            f => f.status === 'validated' && f.name === 'Member mode Inc.'
          ),
          services: [],
        });
    })
    .it('shows a list of requested organizations requested by logged in user ', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsForVaultUsersApi.organizationsGet('member');

      const expected = getOutputFixture('list-organizations-validated-member.output.json');
      expect(JSON.stringify(result)).contains(JSON.stringify(expected));
    });

  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/organizations')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2);
    })
    .it('shows a list of validated organizations when paginated', async () => {
      const api = vaultAPIFactory(environment)(testUserAuth).OrganizationsForVaultUsersApi;

      const result = await getAllPaged(cursor => api.organizationsGet(undefined, cursor)).then(
        reducePages
      );

      const expected = getOutputFixture('list-organizations-validated.output.json');
      expect(result.organizations).to.eql(expected);
    });
});

const response = {
  organizations: [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'SuperData Inc.',
      description: 'My super data handling organization',
      url: 'https://superdata.example.com',
      email: 'admin@superdata.example.com',
      status: 'requested',
      requestor_id: '00000000-0000-0000-0000-000000000000',
      validated_by_id: null,
      agent_id: null,
      validated_at: null,
      created_at: '2020-06-23T08:38:32.915Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'InfoTech Inc.',
      description: 'My InfoTech handling organization',
      url: 'https://infotech.example.com',
      email: 'admin@infotech.example.com',
      status: 'validated',
      requestor_id: '00000000-0000-0000-0000-000000000001',
      validated_by_id: '00000000-0000-0000-0000-000000000011',
      agent_id: null,
      validated_at: '2020-06-25T08:38:32.915Z',
      created_at: '2020-06-23T08:38:32.915Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Member mode Inc.',
      description: 'My Member mode handling organization',
      url: 'https://membermode.example.com',
      email: 'admin@membermode.example.com',
      status: 'validated',
      requestor_id: '00000000-0000-0000-0000-000000000002',
      validated_by_id: '00000000-0000-0000-0000-000000000022',
      agent_id: null,
      validated_at: '2020-06-25T08:38:32.915Z',
      created_at: '2020-06-23T08:38:32.915Z',
    },
  ],
  services: [],
  meta: [],
};

const responsePart1 = {
  organizations: [response.organizations[1]],
  services: [],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [{ next_page_exists: true }],
};

const responsePart2 = {
  ...response,
  organizations: [response.organizations[2]],
};

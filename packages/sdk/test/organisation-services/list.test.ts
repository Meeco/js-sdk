import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { getAllPaged, reducePages } from '../../src/util/paged';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('Organization-services list', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations/organization_id/requested_services')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .it('shows a list of validated organizations', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsManagingServicesApi.organizationsOrganizationIdRequestedServicesGet(
        'organization_id'
      );

      const expected = getOutputFixture('list-organization-services-requested.output.json');
      expect(result.services).to.deep.members(expected);
    });

  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations/organization_id/requested_services')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart1)
        .get('/organizations/organization_id/requested_services')
        .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, responsePart2);
    })
    .it('shows a list of validated organizations when paginated', async () => {
      const api = vaultAPIFactory(environment)(testUserAuth).OrganizationsManagingServicesApi;
      const result = await getAllPaged(cursor =>
        api.organizationsOrganizationIdRequestedServicesGet('organization_id', cursor)
      ).then(reducePages);

      const expected = getOutputFixture('list-organization-services-requested.output.json');
      expect(result.services).to.deep.members(expected);
    });
});

const response = {
  services: [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Life Paths Twitter Service',
      description: 'Life Paths Twitter connect',
      contract: { name: 'sample contract' },
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      validated_at: null,
      agent_id: null,
      created_at: '2020-07-02T05:47:44.983Z',
      status: 'requested',
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Life Paths Facebook Service',
      description: 'Life Path Facebook page connect',
      contract: { name: 'sample contract' },
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      validated_at: null,
      agent_id: null,
      created_at: '2020-07-02T05:47:44.983Z',
      status: 'requested',
    },
  ],
  meta: [],
};

const responsePart1 = {
  ...response,
  services: [response.services[0]],
  next_page_after: MOCK_NEXT_PAGE_AFTER,
  meta: [{ next_page_exists: true }],
};

const responsePart2 = {
  ...response,
  services: [response.services[1]],
};

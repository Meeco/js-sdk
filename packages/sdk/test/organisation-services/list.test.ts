import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
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

      const expected = getOutputFixture('list-organization-services-requested.output.yaml');
      expect(result.services).to.deep.members(expected.spec);
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
};

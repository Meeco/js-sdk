import { expect } from 'chai';
import { vaultAPIFactory } from '../../src/util/api-factory';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuth,
} from '../test-helpers';

describe('organizations:update', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('Updates the organization', async () => {
      const input = getInputFixture('update-organization.input.yaml');
      const organization = input.spec;
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsManagingOrganizationsApi.organizationsIdPut(organization.id, {
        organization,
      });

      const expected = getOutputFixture('update-organization.output.yaml');
      expect(result.organization).to.eql(expected.spec);
    });
});

const response = {
  organization: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'xyz company',
    description: 'new description of company',
    url: 'https://xyzcompany.com',
    email: 'xyzcompany@abc.com',
    status: 'requested',
    requestor_id: '00000000-0000-0000-0000-000000000000',
    validated_by_id: null,
    agent_id: null,
    validated_at: null,
    created_at: '2020-06-23T08:38:32.915Z',
  },
};

function mockVault(api) {
  api
    .put('/organizations/00000000-0000-0000-0000-000000000001', {
      organization: {
        name: 'xyz company',
        description: 'new description of company',
        url: 'https://xyzcompany.com',
        email: 'xyzcompany@abc.com',
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('Organization-services get', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('returns a validated or requested by logged in user organization ', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsForVaultUsersApi.organizationsOrganizationIdServicesIdGet(
        'organization_id',
        'service_id'
      );

      const expected = getOutputFixture('get-organization-service.output.json');
      expect(result.service).to.eql(expected);
    });
});

const response = {
  service: {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Sample Service',
    description: 'Sample service description',
    contract: { name: 'sample contract' },
    organization_id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
    validated_by_id: null,
    validated_at: null,
    agent_id: null,
    created_at: '2020-07-02T05:47:44.983Z',
    status: 'requested',
  },
};

function mockVault(api) {
  api
    .get('/organizations/organization_id/services/service_id')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

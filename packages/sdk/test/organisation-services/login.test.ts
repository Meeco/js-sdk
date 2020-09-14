import { expect } from '@oclif/test';
import { OrganizationServicesService } from '../../src/services/organization-services-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuthFixture
} from '../test-helpers';

describe('Organization-services login', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('returns organization service agent login information ', async () => {
      const input = getInputFixture('login-organization-service.input.yaml');
      const orgService = new OrganizationServicesService(
        environment,
        testUserAuthFixture.metadata.vault_access_token
      );
      const result = await orgService.getLogin(
        input.spec.organization_id,
        input.spec.id,
        input.metadata.privateKey
      );

      const expected = getOutputFixture('get-organization-service-login.output.yaml');
      expect(JSON.stringify(result)).contains(JSON.stringify(expected.metadata));
    });
});

const response = {
  token_type: 'bearer',
  encrypted_access_token: 'DP2HJmMPgGgExZCAsHDf',
};

function mockVault(api) {
  api
    .post(
      '/organizations/00000000-0000-0000-0000-000000000011/services/00000000-0000-0000-0000-000000000001/login'
    )
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

import { expect } from '@oclif/test';
import { OrganizationsService } from '../../src/services/organizations-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuthFixture,
} from '../test-helpers';

describe('Organizations login', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('returns organization agent login information ', async () => {
      const input = getInputFixture('login-organization.input.yaml');
      const service = new OrganizationsService(
        environment,
        testUserAuthFixture.metadata.vault_access_token
      );
      const result = await service.getLogin(input.spec.id, input.metadata.privateKey);

      const expected = getOutputFixture('get-organization-login.output.yaml');
      expect(JSON.stringify(result)).to.contain(JSON.stringify(expected.metadata));
    });
});

const response = {
  token_type: 'bearer',
  encrypted_access_token: 'DP2HJmMPgGgExZCAsHDf',
};

function mockVault(api) {
  api
    .post('/organizations/00000000-0000-0000-0000-000000000001/login')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

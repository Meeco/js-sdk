import { OrganizationServicesService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import nock from 'nock';
import { decryptedPrivateKey } from '../fixtures/responses/keypair-response';
import { customTest, environment, getInputFixture, testUserAuthFixture } from '../test-helpers';

describe('Organization-services login', () => {
  const input = getInputFixture('login-organization-service.input.json');
  const storedToken = 'abc';

  before(function () {
    nock('https://sandbox.meeco.me/vault')
      .post(`/organizations/${input.organization_id}/services/${input.id}/login`)
      .matchHeader('Authorization', testUserAuthFixture.vault_access_token)
      .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
      .reply(200, {
        token_type: 'bearer',
        encrypted_access_token: storedToken,
      });
  });

  customTest.mockCryppo().it('returns organization service agent login information ', async () => {
    const orgService = new OrganizationServicesService(environment, testUserAuthFixture);
    const result = await orgService.getLogin(input.organization_id, input.id, decryptedPrivateKey);

    expect(result.vault_access_token).to.match(
      /^\[decrypted\]abc-----BEGIN RSA PRIVATE KEY-----.*/
    );
  });
});

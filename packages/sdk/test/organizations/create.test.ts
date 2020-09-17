import { expect } from 'chai';
import { OrganizationsService } from '../../src/services/organizations-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuthFixture,
} from '../test-helpers';

describe('Organizations create', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('Requests the creation of a new organization', async () => {
      const input = getInputFixture('create-organization.input.json');
      const service = new OrganizationsService(environment, testUserAuthFixture.vault_access_token);
      const result = await service.create({
        ...input,
      });

      const { privateKey, publicKey, ...expectedSpec } = getOutputFixture(
        'create-organization.output.json'
      );
      expect(result.organization).to.eql(expectedSpec);
    });
});

const response = {
  organization: {
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
};

function mockVault(api) {
  api
    .post('/organizations', {
      name: 'SuperData Inc.',
      description: 'My super data handling organization',
      url: 'https://superdata.example.com',
      email: 'admin@superdata.example.com',
      public_key: '--PUBLIC_KEY--ABCD',
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

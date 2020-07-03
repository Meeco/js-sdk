import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-services:get', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organization-services:get',
      'organization_id',
      'service_id',
      ...testUserAuth,
      ...testEnvironmentFile
    ])
    .it('returns a validated or requested by logged in user organization ', ctx => {
      const expected = readFileSync(outputFixture('get-organization-service.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
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
    status: 'requested'
  }
};

function mockVault(api) {
  api
    .get('/organizations/organization_id/services/service_id')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

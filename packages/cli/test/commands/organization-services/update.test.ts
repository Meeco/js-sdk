import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organization-services:update', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organization-services:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      'organization_id',
      '-s',
      inputFixture('update-organization-service.input.yaml'),
    ])
    .it('Updates the organization', ctx => {
      const expected = readFileSync(
        outputFixture('update-organization-service.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function mockVault(api) {
  api
    .put('/organizations/organization_id/services/f71272a3-d26b-4b85-9b0b-b3fd24c4ea0a', {
      service: {
        name: 'Sample Service',
        description: 'Sample service description',
        contract: { name: 'sample contract' },
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

const response = {
  service: {
    id: 'f71272a3-d26b-4b85-9b0b-b3fd24c4ea0a',
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
  organization: {
    id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
    name: 'Alphabet Inc.',
    description: 'My super data handling organization',
    url: 'https://superdata.example.com',
    email: 'admin@superdata.example.com',
    requestor_id: '468d3666-dfd7-4a17-9091-3bdcf51f45bb',
    validated_by_id: '49a38f1c-4a92-464e-bed2-cd6ffa428da1',
    validated_at: '2020-07-02T01:58:07.313Z',
    agent_id: '706ff9fb-bd58-4707-ba6c-50f97b94718b',
    created_at: '2020-07-02T01:57:42.437Z',
    updated_at: '2020-07-02T01:58:07.934Z',
    status: 'validated',
  },
};

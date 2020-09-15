import * as sdk from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('organization-services:update', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
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

const result = {
  organization: {
    id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
    name: 'Alphabet Inc.',
    description: 'My super data handling organization',
    url: 'https://superdata.example.com',
    email: 'admin@superdata.example.com',
    status: 'validated',
    requestor_id: '468d3666-dfd7-4a17-9091-3bdcf51f45bb',
    validated_by_id: '49a38f1c-4a92-464e-bed2-cd6ffa428da1',
    agent_id: '706ff9fb-bd58-4707-ba6c-50f97b94718b',
    validated_at: new Date('2020-07-02T01:58:07.313Z'),
    created_at: new Date('2020-07-02T01:57:42.437Z')
  },
  service: {
    id: 'f71272a3-d26b-4b85-9b0b-b3fd24c4ea0a',
    name: 'Sample Service',
    description: 'Sample service description',
    contract: {
      name: 'sample contract'
    },
    status: 'requested',
    organization_id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
    validated_by_id: null,
    agent_id: null,
    validated_at: null,
    created_at: new Date('2020-07-02T05:47:44.983Z')
  }
}

function vaultAPIFactory(environment) {
  return (authConfig) => ({
    OrganizationsManagingServicesApi: {
      organizationsOrganizationIdServicesIdPut: (serviceId, organizationId, updateOrganizationServiceParams) => Promise.resolve(result)
    }
  });
}
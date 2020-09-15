import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-services:list', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run(['organization-services:list', 'organization_id', ...testUserAuth, ...testEnvironmentFile])
    .it('shows a list of validated organizations', ctx => {
      const expected = readFileSync(
        outputFixture('list-organization-services-requested.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.contain(expected.trim());
    });
});

const result = {
  services: [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Life Paths Twitter Service',
      description: 'Life Paths Twitter connect',
      contract: { name: 'sample contract' },
      status: 'requested',
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      agent_id: null,
      validated_at: null,
      created_at: new Date('2020-07-02T05:47:44.983Z')
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Life Paths Facebook Service',
      description: 'Life Path Facebook page connect',
      contract: { name: 'sample contract' },
      status: 'requested',
      organization_id: '00000000-0000-0000-0000-000000000011',
      validated_by_id: null,
      agent_id: null,
      validated_at: null,
      created_at: new Date('2020-07-02T05:47:44.983Z')
    }
  ],
  meta: null,
  next_page_after: null
};

function vaultAPIFactory(environment) {
  return (authConfig) => ({
    OrganizationsManagingServicesApi: {
      organizationsOrganizationIdRequestedServicesGet: (organizationId) => Promise.resolve(result)
    }
  });
}

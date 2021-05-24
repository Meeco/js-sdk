import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-services:get', () => {
  customTest
    .stub(sdk.mockableFactories, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run([
      'organization-services:get',
      'organization_id',
      'service_id',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('returns a validated or requested by logged in user organization ', ctx => {
      const expected = readFileSync(outputFixture('get-organization-service.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function vaultAPIFactory(environment) {
  return authConfig => ({
    OrganizationsForVaultUsersApi: {
      organizationsOrganizationIdServicesIdGet: (organizationId, serviceId) => {
        return Promise.resolve({
          service: {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Sample Service',
            description: 'Sample service description',
            contract: {
              name: 'sample contract',
            },
            status: 'requested',
            organization_id: 'e2fed464-878b-4d4b-9017-99abc50504ed',
            validated_by_id: null,
            agent_id: null,
            validated_at: null,
            created_at: new Date('2020-07-02T05:47:44.983Z'),
          },
        });
      },
    },
  });
}

import * as sdk from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organizations:update', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run([
      'organizations:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-o',
      inputFixture('update-organization.input.yaml'),
    ])
    .it('Updates the organization', ctx => {
      const expected = readFileSync(outputFixture('update-organization.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function vaultAPIFactory(environment) {
  return authConfig => ({
    OrganizationsManagingOrganizationsApi: {
      organizationsIdPut: (organizationId, updateOrganizationParams) => {
        return Promise.resolve({
          organization: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'xyz company',
            description: 'new description of company',
            url: 'https://xyzcompany.com',
            email: 'xyzcompany@abc.com',
            status: 'requested',
            requestor_id: '00000000-0000-0000-0000-000000000000',
            validated_by_id: null,
            agent_id: null,
            validated_at: null,
            created_at: new Date('2020-06-23T08:38:32.915Z'),
          },
        });
      },
    },
  });
}

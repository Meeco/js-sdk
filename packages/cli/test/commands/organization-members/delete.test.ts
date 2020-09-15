import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-members:delete', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run([
      'organization-members:delete',
      'organization_id',
      'id',
      ...testUserAuth,
      ...testEnvironmentFile,
    ])
    .it('delete a requested organization member', (ctx) => {
      expect(ctx.stdout.trim()).to.equal('Member successfully deleted');
    });
});

function vaultAPIFactory(environment) {
  return (authConfig) => ({
    OrganizationsManagingMembersApi: {
      organizationsOrganizationIdMembersIdDelete: (organizationId, id) => Promise.resolve()
    }
  });
}
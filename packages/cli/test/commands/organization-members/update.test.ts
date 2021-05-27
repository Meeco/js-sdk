import * as sdk from '@meeco/sdk';
import { expect } from 'chai';
import { customTest, inputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-members:update', () => {
  customTest
    .stub(sdk.mockableFactories, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run([
      'organization-members:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-m',
      inputFixture('update-organization-member.input.yaml'),
    ])
    .it('Updates the organization member', ctx => {
      expect(ctx.stdout.trim()).to.equal('Successfully updated');
    });
});

function vaultAPIFactory(environment) {
  return authConfig => ({
    OrganizationsManagingMembersApi: {
      organizationsOrganizationIdMembersIdPut: (
        organizationId,
        memberId,
        organizationMembersRoleParams
      ) => Promise.resolve(),
    },
  });
}

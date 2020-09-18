import * as sdk from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organizations:delete', () => {
  customTest
    .stub(sdk, 'vaultAPIFactory', vaultAPIFactory as any)
    .stdout()
    .stderr()
    .run(['organizations:delete', 'id', ...testUserAuth, ...testEnvironmentFile])
    .it('delete a requested organization', ctx => {
      expect(ctx.stdout.trim()).to.equal('Organization successfully deleted');
    });
});

function vaultAPIFactory(environment) {
  return authConfig => ({
    OrganizationsManagingOrganizationsApi: {
      organizationsIdDelete: id => Promise.resolve(),
    },
  });
}

import { UserService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('users:logout', () => {
  customTest
    .stub(UserService.prototype, 'deleteSessions', deleteTokens as any)
    .stderr()
    .stdout()
    .run(['users:logout', ...testUserAuth, ...testEnvironmentFile])
    .it('deletes tokens when given an auth config)', ctx => {
      const expected = 'Logging out... done';
      expect(ctx.stderr.trim()).to.contain(expected.trim());
    });
});

function deleteTokens(vaultToken, keystoreToken) {
  return Promise.resolve([]);
}

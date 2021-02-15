import { OrganizationService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organizations:login', () => {
  customTest
    .stub(OrganizationService.prototype, 'getOrganizationToken', getLogin as any)
    .stdout()
    .stderr()
    .run([
      'organizations:login',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-o',
      inputFixture('login-organization.input.yaml'),
    ])
    .it('returns organization agent login information ', ctx => {
      const expected = readFileSync(outputFixture('get-organization-login.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function getLogin(organizationId, privateKey) {
  return Promise.resolve({
    vault_access_token: '[decrypted]DP2HJmMPgGgExZCAsHDf--PRIVATE_KEY--12324',
  });
}

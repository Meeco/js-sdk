import { OrganizationServicesService } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organization-services:login', () => {
  customTest
    .stdout()
    .stderr()
    .stub(OrganizationServicesService.prototype, 'getLogin', getLogin as any)
    .run([
      'organization-services:login',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-s',
      inputFixture('login-organization-service.input.yaml'),
    ])
    .it('returns organization service agent login information ', ctx => {
      const expected = readFileSync(
        outputFixture('get-organization-service-login.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function getLogin(organizationId, serviceId, privateKey) {
  return Promise.resolve({
    data_encryption_key: '',
    key_encryption_key: '',
    keystore_access_token: '',
    passphrase_derived_key: '',
    secret: '',
    vault_access_token: '[decrypted]DP2HJmMPgGgExZCAsHDf--PRIVATE_KEY--12324',
  });
}

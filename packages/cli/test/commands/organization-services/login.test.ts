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
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
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

const response = {
  token_type: 'bearer',
  encrypted_access_token: 'DP2HJmMPgGgExZCAsHDf',
};

function mockVault(api) {
  api
    .post(
      '/organizations/00000000-0000-0000-0000-000000000011/services/00000000-0000-0000-0000-000000000001/login'
    )
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

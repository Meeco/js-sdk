import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('organizations:login', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organizations:login',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-o',
      inputFixture('login-organization.input.yaml')
    ])
    .it('returns organization agent login information ', ctx => {
      const expected = readFileSync(outputFixture('get-organization-login.output.yaml'), 'utf-8');
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

const response = {
  token_type: 'bearer',
  encrypted_access_token: 'DP2HJmMPgGgExZCAsHDf'
};

function mockVault(api) {
  api
    .post('/organizations/00000000-0000-0000-0000-000000000001/login')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

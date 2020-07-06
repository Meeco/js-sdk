import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-services:login', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organization-services:login',
      'organization_id',
      'service_id',
      ...testUserAuth,
      ...testEnvironmentFile
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
  user_access_token: {
    id: 'fefcc924-8278-499a-bc71-e78956a30e07',
    token: 'DP2HJmMPgGgExZCAsHDf',
    name: null,
    client_identifier: '552594a937b7ca4469e3637edcdcc77c',
    device_push_token: null,
    push_token_platform: null,
    timezone: null,
    expire_at: '3020-07-02T02:45:29.965Z'
  },
  token_type: 'bearer',
  access_token: 'DP2HJmMPgGgExZCAsHDf'
};

function mockVault(api) {
  api
    .post('/organizations/organization_id/services/service_id/login')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

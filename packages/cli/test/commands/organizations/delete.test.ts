import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organizations:delete', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/organizations/id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .stdout()
    .stderr()
    .run(['organizations:delete', 'id', ...testUserAuth, ...testEnvironmentFile])
    .it('delete a requested organization', ctx => {
      expect(ctx.stderr).to.equal('');
    });
});

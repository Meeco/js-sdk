import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:delete', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/shares/my_share_id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .stdout()
    .stderr()
    .run(['shares:delete', 'my_share_id', ...testUserAuth, ...testEnvironmentFile])
    .it('delete existing share', ctx => {
      expect(ctx.stderr).to.contain('Share successfully deleted');
    });
});

import { expect } from '@oclif/test';
import { customTest, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-members:delete', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', api =>
      api
        .delete('/organizations/organization_id/members/id')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(204)
    )
    .stdout()
    .stderr()
    .run([
      'organization-members:delete',
      'organization_id',
      'id',
      ...testUserAuth,
      ...testEnvironmentFile
    ])
    .it('delete a requested organization member', ctx => {
      expect(ctx.stderr).to.equal('');
    });
});

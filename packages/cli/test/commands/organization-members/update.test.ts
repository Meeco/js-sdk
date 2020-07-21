import { OrganizationMemberRoles } from '@meeco/sdk';
import { expect } from 'chai';
import { customTest, inputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('organization-members:update', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organization-members:update',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-m',
      inputFixture('update-organization-member.input.yaml')
    ])
    .it('Updates the organization member', ctx => {
      expect(ctx.stderr).to.equal('');
    });
});

function mockVault(api) {
  api
    .put('/organizations/organization_id/members/cbd44308-d7b2-4eb3-b5e1-3a1dc9f12139', {
      organization_member: {
        role: OrganizationMemberRoles.Owner
      }
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200);
}

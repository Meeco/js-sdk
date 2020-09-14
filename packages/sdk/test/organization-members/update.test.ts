import { OrganizationMemberRoles } from '../../src/services/organization-members-service';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, getInputFixture, testUserAuth } from '../test-helpers';

describe('Organization-members update', () => {
  customTest
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .it('Updates the organization member', async () => {
      const input = getInputFixture('update-organization-member.input.yaml');
      await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsManagingMembersApi.organizationsOrganizationIdMembersIdPut(
        input.spec.organization_id,
        input.spec.id,
        {
          organization_member: {
            role: input.spec.role,
          }
        }
      );
    });
});

function mockVault(api) {
  api
    .put('/organizations/organization_id/members/cbd44308-d7b2-4eb3-b5e1-3a1dc9f12139', {
      organization_member: {
        role: OrganizationMemberRoles.Owner,
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200);
}

import { expect } from '@oclif/test';
import { vaultAPIFactory } from '../../src/util/api-factory';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('organization-members:list', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', api => {
      api
        .get('/organizations/organization_id/members')
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    })
    .it('shows a list of validated organizations', async () => {
      const result = await vaultAPIFactory(environment)(
        testUserAuth
      ).OrganizationsManagingMembersApi.organizationsOrganizationIdMembersGet('organization_id');

      const expected = getOutputFixture('list-organization-members-validated.output.yaml');
      expect(result.organization).to.eql(expected.spec.organization);
      expect(result.members).to.deep.members(expected.spec.members);
    });
});

const response = {
  organization: {
    id: 'c3fbac57-1eb8-41c3-a3de-3f946979945d',
    name: 'Meeco',
    description:
      'Meeco gives people and organisations the tools to access, control and create mutual value from personal data. Privately, securely and with explicit consent.',
    url: 'https://www.meeco.me/',
    email: 'contact@meeco.me',
    requestor_id: 'e6b42a76-eacf-4e1b-985d-a36f04177e16',
    validated_by_id: 'e6b42a76-eacf-4e1b-985d-a36f04177e16',
    validated_at: '2020-06-17T02:47:43.861Z',
    agent_id: null,
    created_at: '2020-06-05T04:02:11.174Z',
    updated_at: '2020-06-17T02:47:43.874Z',
    status: 'validated',
  },
  members: [
    {
      id: 'e6b42a76-eacf-4e1b-985d-a36f04177e16',
      full_name: null,
      email: 'owner@meeco.com',
      is_app_logging_enabled: null,
      image: null,
      role: 'owner',
    },
  ],
};

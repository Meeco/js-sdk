import { OrganizationMembersService } from '@meeco/sdk';
import { expect } from 'chai';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testOrganizationUserAuth,
  testOrganizationUserAuthFixture,
  testUserAuth,
} from '../test-helpers';

describe('OrganizationMembersService', () => {
  describe('#createInvitation', () => {
    const response = {
      invitation: {
        id: 'c43595b3-4ab6-4777-b925-95567001f8d2',
        message: null,
        sent_at: null,
        invited_user_id: null,
        token: 'I2aUc0zEU2veqg52QtKbwEsJ1eNIqWlBdjH5FrRIKXg',
        outgoing: true,
        user_name: 'Anonymous User',
        user_image: 'http://localhost:3000/images/69074548-24cb-403d-828c-09af6002e1c3',
        keypair_external_id: 'org-agent-keypair',
        email: null,
        user_email: null,
        encrypted_recipient_name: null,
        integration_data: {
          intent: 'member',
          organization_id: '00000000-0000-0000-0000-000000000000',
          organization_member_role: 'admin',
        },
      },
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .post('/invitations', {
            public_key: {
              keypair_external_id: 'org-agent-keypair',
              public_key: '--PUBLIC_KEY--ABCD',
            },
            invitation: {
              organization_member_role: 'admin',
            },
          })
          .matchHeader('Authorization', testOrganizationUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, response)
      )
      .add('input', () => getInputFixture('create-organization-members-invitation.input.json'))
      .do(({ input }) =>
        new OrganizationMembersService(environment).createInvite(
          testOrganizationUserAuthFixture,
          input.publicKey
        )
      )
      .it('Requests the creation of a new organization member invitation');
  });

  describe('#list', () => {
    const orgId = 'organization_id';
    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/organizations/${orgId}/members`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, {
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
              {
                id: 'abc123',
                full_name: 'Jim Bob Jenkins',
                email: 'jim@email.com',
                is_app_logging_enabled: null,
                image: null,
                role: 'admin',
              },
            ],
            meta: [],
          });
      })
      .do(() => new OrganizationMembersService(environment).list(testUserAuth, orgId))
      .it('calls GET /organizations/id/members');
  });

  describe('#listAll', () => {
    const orgId = 'organization_id';

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
        {
          id: 'abc123',
          full_name: 'Jim Bob Jenkins',
          email: 'jim@email.com',
          is_app_logging_enabled: null,
          image: null,
          role: 'admin',
        },
      ],
      meta: [],
    };

    const responsePart1 = {
      ...response,
      members: [response.members[0]],
      next_page_after: MOCK_NEXT_PAGE_AFTER,
      meta: [
        {
          next_page_exists: true,
        },
      ],
    };

    const responsePart2 = {
      ...response,
      members: [response.members[1]],
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/organizations/${orgId}/members`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, responsePart1)
          .get(`/organizations/${orgId}/members`)
          .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, responsePart2);
      })
      .add('result', () => new OrganizationMembersService(environment).listAll(testUserAuth, orgId))
      .it('fetches a list of validated organizations when paginated', async ({ result }) => {
        const expected = getOutputFixture('list-organization-members-validated.output.json');
        expect(result.organization).to.eql(expected.organization);
        expect(result.members).to.deep.members(expected.members);
      });
  });

  describe('#updateMemberRole', () => {
    const input = getInputFixture('update-organization-member.input.json');

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .put(`/organizations/${input.organization_id}/members/${input.id}`, {
            organization_member: {
              role: input.role,
            },
          })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200)
      )
      .do(() =>
        new OrganizationMembersService(environment).updateMemberRole(
          testUserAuth,
          input.organization_id,
          input.id,
          input.role
        )
      )
      .it('Updates the organization member');
  });
});

import { OrganizationMembersService } from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('organization-members:accept-invitation', () => {
  customTest
    .stub(OrganizationMembersService.prototype, 'acceptInvite', acceptInvite as any)
    .stdout()
    .stderr()
    .run([
      'organization-members:accept-invitation',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('accept-organization-members-invitation.input.yaml'),
    ])
    .it('Requests the creation of a new organization member invitation', ctx => {
      const expected = readFileSync(
        outputFixture('accept-organization-members-invitation.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function acceptInvite(vaultAccessToken, invitationToken) {
  return Promise.resolve({
    connection: {
      own: {
        id: 'c0d1988f-b404-4402-8040-33f0201dc725',
        encrypted_recipient_name: null,
        integration_data: {
          intent: 'member',
          organization_id: '5a45e7ca-86c5-4a1f-9962-dc3775c3c7bd',
          organization_member_role: 'admin',
          organization_member_id: 'cfbf3f4e-735b-46a1-97ee-8cc13c0bb2dd'
        },
        connection_type: 'member',
        user_image: 'http://localhost:3000/images/69074548-24cb-403d-828c-09af6002e1c3',
        user_type: 'organization_agent',
        user_public_key: '--PUBLIC_KEY--ABCD',
        user_keypair_external_id: null
      },
      the_other_user: {
        id: 'b0d1988f-b404-4402-8040-33f0201dc725',
        connection_type: 'member',
        user_id: '8da5ebf9-39bf-45ae-b131-fa85e2d88101',
        user_image: null,
        user_type: 'organization_agent',
        user_public_key: '--PUBLIC_KEY--ABCD',
        user_keypair_external_id: '69074548-24cb-403d-828c-09af6002e1c4'
      }
    },
    privateKey: '--PRIVATE_KEY--12324',
    publicKey: '--PUBLIC_KEY--ABCD'
  });
}
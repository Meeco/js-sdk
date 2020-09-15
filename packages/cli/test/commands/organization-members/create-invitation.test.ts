import { OrganizationMembersService } from '@meeco/sdk';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organization-members:create-invitation', () => {
  customTest
    .stub(OrganizationMembersService.prototype, 'createInvite', createInvite as any)
    .stdout()
    .stderr()
    .run([
      'organization-members:create-invitation',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-o',
      inputFixture('create-organization-members-invitation.input.yaml'),
    ])
    .it('Requests the creation of a new organization member invitation', ctx => {
      const expected = readFileSync(
        outputFixture('create-organization-members-invitation.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

function createInvite(vaultAccessToken, publicKey, memberRole) {
  return Promise.resolve({
    id: 'c43595b3-4ab6-4777-b925-95567001f8d2',
    email: null,
    message: null,
    sent_at: null,
    invited_user_id: null,
    token: 'I2aUc0zEU2veqg52QtKbwEsJ1eNIqWlBdjH5FrRIKXg',
    outgoing: true,
    user_name: 'Anonymous User',
    user_image: 'http://localhost:3000/images/69074548-24cb-403d-828c-09af6002e1c3',
    user_email: '',
    keypair_external_id: null,
    encrypted_recipient_name: null,
    integration_data: {
      intent: 'member',
      organization_id: '00000000-0000-0000-0000-000000000000',
      organization_member_role: 'admin',
    },
  });
}

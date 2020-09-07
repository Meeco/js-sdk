import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('organization-members:accept-invitation', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
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

const response = {
  connection: {
    id: 'c0d1988f-b404-4402-8040-33f0201dc725',
    encryption_space_id: null,
    encrypted_recipient_name: null,
    integration_data: {
      intent: 'member',
      organization_id: '5a45e7ca-86c5-4a1f-9962-dc3775c3c7bd',
      organization_member_role: 'admin',
      organization_member_id: 'cfbf3f4e-735b-46a1-97ee-8cc13c0bb2dd',
    },
    user_id: '8da5ebf9-39bf-45ae-b131-fa85e2d88101',
    user_name: 'Anonymous User',
    user_image: 'http://localhost:3000/images/69074548-24cb-403d-828c-09af6002e1c3',
    user_email: '',
    user_type: 'organization_agent',
    public_key: '--PUBLIC_KEY--ABCD',
    keypair_external_id: null,
    other_user_connection_encryption_space_id: null,
    other_user_connection_public_key: '--PUBLIC_KEY--ABCD',
    other_user_connection_keypair_external_id: '69074548-24cb-403d-828c-09af6002e1c4',
  },
};

function mockVault(api) {
  api
    .post('/connections', {
      public_key: {
        public_key: '--PUBLIC_KEY--ABCD',
      },
      connection: {
        invitation_token: 'I2aUc0zEU2veqg52QtKbwEsJ1eNIqWlBdjH5FrRIKXg',
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

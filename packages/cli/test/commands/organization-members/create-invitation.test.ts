import { expect } from 'chai';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('organization-members:create-invitation', () => {
  customTest
    .stdout()
    .stderr()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .run([
      'organization-members:create-invitation',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-o',
      inputFixture('create-organization-members-inviataion.input.yaml')
    ])
    .it('Requests the creation of a new organization member invitation', ctx => {
      const expected = readFileSync(
        outputFixture('create-organization-members-invitation.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout.trim()).to.equal(expected.trim());
    });
});

const response = {
  invitation: {
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
      organization_member_role: 'admin'
    }
  }
};

function mockVault(api) {
  api
    .post('/invitations', {
      public_key: {
        public_key: '--PUBLIC_KEY--ABCD'
      },
      invitation: {
        organization_member_role: 'admin'
      }
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

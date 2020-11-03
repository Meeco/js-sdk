import { expect } from '@oclif/test';
import { InvitationService } from 'packages/sdk/src/services/invitation-service';
import sinon from 'sinon';
import { customTest, environment, getOutputFixture, testUserAuth } from '../test-helpers';

describe('Organization-members accept-invitation', () => {
  const token = 'I2aUc0zEU2veqg52QtKbwEsJ1eNIqWlBdjH5FrRIKXg';

  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', api => api.post('/connections').reply(200, response))
    .stub(
      InvitationService.prototype,
      'createAndStoreKeyPair',
      sinon.stub().returns({
        id: 'from_stored_keypair_id',
        public_key: '--PUBLIC_KEY--ABCD',
      })
    )
    .it('preserves connection metadata', async () => {
      const result = await new InvitationService(environment).accept(testUserAuth, '', token);

      const { privateKey, publicKey, ...expectedSpec } = getOutputFixture(
        'accept-organization-members-invitation.output.json'
      );
      expect(result).to.eql(expectedSpec);
    });
});

const response = {
  connection: {
    own: {
      id: 'c0d1988f-b404-4402-8040-33f0201dc725',
      encrypted_recipient_name: null,
      integration_data: {
        intent: 'member',
        organization_id: '5a45e7ca-86c5-4a1f-9962-dc3775c3c7bd',
        organization_member_role: 'admin',
        organization_member_id: 'cfbf3f4e-735b-46a1-97ee-8cc13c0bb2dd',
      },
      user_id: '6b98e09f-9de7-4f7c-b6f7-f234ef5122ed',
      connection_type: 'member',
      user_image: 'http://localhost:3000/images/69074548-24cb-403d-828c-09af6002e1c3',
      user_type: 'organization_agent',
      user_public_key: '--PUBLIC_KEY--ABCD',
      user_keypair_external_id: '69074548-24cb-403d-828c-09af6002e1c4',
    },
    the_other_user: {
      id: 'b0d1988f-b404-4402-8040-33f0201dc725',
      connection_type: 'member',
      integration_data: {
        intent: 'member',
        organization_id: '5a45e7ca-86c5-4a1f-9962-dc3775c3c7bd',
        organization_member_role: 'admin',
        organization_member_id: 'cfbf3f4e-735b-46a1-97ee-8cc13c0bb2dd',
      },
      user_id: '8da5ebf9-39bf-45ae-b131-fa85e2d88101',
      user_image: null,
      user_type: 'organization_agent',
      user_public_key: '--PUBLIC_KEY--ABCD',
      user_keypair_external_id: 'org-agent-keypair',
    },
  },
};

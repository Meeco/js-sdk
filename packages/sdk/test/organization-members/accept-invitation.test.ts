import { expect } from '@oclif/test';
import nock from 'nock/types';
import { InvitationService } from 'packages/sdk/src/services/invitation-service';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  testUserAuthFixture,
} from '../test-helpers';

describe('Organization-members accept-invitation', () => {
  customTest
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .nock('https://sandbox.meeco.me/keystore', stubKeystore)
    .it('Requests the creation of a new organization member invitation', async () => {
      const input = getInputFixture('accept-organization-members-invitation.input.json');
      const result = await new InvitationService(environment).accept(
        testUserAuthFixture,
        '',
        input.token
      );

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

function mockVault(api) {
  api
    .post('/connections', {
      public_key: {
        keypair_external_id: 'from_stored_keypair_id',
        public_key: '--PUBLIC_KEY--ABCD',
      },
      connection: {
        encrypted_recipient_name: '[serialized][encrypted][with undefined]',
        invitation_token: 'I2aUc0zEU2veqg52QtKbwEsJ1eNIqWlBdjH5FrRIKXg',
      },
    })
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, response);
}

function stubKeystore(api: nock.Scope) {
  api
    .post('/keypairs', {
      public_key: '--PUBLIC_KEY--ABCD',
      encrypted_serialized_key: '[serialized][encrypted]--PRIVATE_KEY--12324[with undefined]',
      metadata: {},
      external_identifiers: [],
    })
    .matchHeader('Authorization', 'a2V5c3RvcmVfYXV0aF90b2tlbg==')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      keypair: {
        id: 'from_stored_keypair_id',
      },
    });
}

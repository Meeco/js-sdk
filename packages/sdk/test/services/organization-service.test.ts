import { expect } from 'chai';
import { OrganizationService } from '../../src/services/organization-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { decryptedPrivateKey } from '../fixtures/responses/keypair-response';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('OrganizationService', () => {
  describe('#create', () => {
    const orgName = 'SuperData Inc.';
    // defined by mockCryppo
    const publicKey = '-----BEGIN PUBLIC KEY-----ABCD';
    const privateKey = '-----BEGIN RSA PRIVATE KEY-----ABCD';

    const info = {
      description: 'My super data handling organization',
      url: 'https://superdata.example.com',
      email: 'admin@superdata.example.com',
    };

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .post('/organizations', {
            name: orgName,
            public_key: publicKey,
            ...info,
          })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, {})
      )
      .add('result', () => new OrganizationService(environment).create(testUserAuth, orgName, info))
      .it('Calls POST /organizations and returns generated keys', ({ result }) => {
        expect(result.publicKey.key).to.equal(publicKey);
        expect(result.privateKey.key).to.equal(privateKey);
      });
  });

  describe('#getOrganizationToken', () => {
    const token = 'ACCESS_TOKEN';
    const id = '00000000-0000-0000-0000-000000000001';
    const privateKey = decryptedPrivateKey;

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .post(`/organizations/${id}/login`)
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, {
            token_type: 'bearer',
            encrypted_access_token: token,
          })
      )
      .add('result', () =>
        new OrganizationService(environment).getOrganizationToken(testUserAuth, id, privateKey)
      )
      .it('Calls POST /organizations/id/login and decrypts the returned token', ({ result }) => {
        expect(result.vault_access_token).to.equal(`[decrypted]${token}${privateKey}`);
      });
  });

  describe('#listAll', () => {
    const response = {
      organizations: [
        {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'SuperData Inc.',
          description: 'My super data handling organization',
          url: 'https://superdata.example.com',
          email: 'admin@superdata.example.com',
          status: 'requested',
          requestor_id: '00000000-0000-0000-0000-000000000000',
          validated_by_id: null,
          agent_id: null,
          validated_at: null,
          created_at: '2020-06-23T08:38:32.915Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'InfoTech Inc.',
          description: 'My InfoTech handling organization',
          url: 'https://infotech.example.com',
          email: 'admin@infotech.example.com',
          status: 'validated',
          requestor_id: '00000000-0000-0000-0000-000000000001',
          validated_by_id: '00000000-0000-0000-0000-000000000011',
          agent_id: null,
          validated_at: '2020-06-25T08:38:32.915Z',
          created_at: '2020-06-23T08:38:32.915Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Member mode Inc.',
          description: 'My Member mode handling organization',
          url: 'https://membermode.example.com',
          email: 'admin@membermode.example.com',
          status: 'validated',
          requestor_id: '00000000-0000-0000-0000-000000000002',
          validated_by_id: '00000000-0000-0000-0000-000000000022',
          agent_id: null,
          validated_at: '2020-06-25T08:38:32.915Z',
          created_at: '2020-06-23T08:38:32.915Z',
        },
      ],
      services: [],
      meta: [],
    };

    const responsePart1 = {
      organizations: [response.organizations[1]],
      services: [],
      next_page_after: MOCK_NEXT_PAGE_AFTER,
      meta: [{ next_page_exists: true }],
    };

    const responsePart2 = {
      ...response,
      organizations: [response.organizations[2]],
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get('/organizations')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .once()
          .reply(200, responsePart1);

        api
          .get('/organizations')
          .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, responsePart2);
      })
      .add('result', () => new OrganizationService(environment).listAll(testUserAuth))
      .it('shows a list of validated organizations when paginated', ({ result }) => {
        expect(result.organizations.length).to.eql(2);
      });
  });
});

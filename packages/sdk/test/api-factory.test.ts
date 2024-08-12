import { expect } from '@oclif/test';
import nock from 'nock';
import { configureFetch, keystoreAPIFactory, vaultAPIFactory } from '../src/util/api-factory';

describe('API Factories', () => {
  before(() => {
    configureFetch();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('keystoreAPIFactory', () => {
    it('adds the required authorization headers and default version headers to request methods', async () => {
      nock('https://meeco-keystore.example.com/')
        .get('/keypairs/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-keystore-token')
        .reply(200, {
          keypair: {
            id: 'my-id',
            public_key: 'public-key-of-it',
            encrypted_serialized_key: 'encrypted-key',
            metadata: {},
            external_identifiers: [],
          },
        });
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com',
        },
      });
      const forUser = apiFactory(<any>{
        keystore_access_token: 'my-keystore-token',
      });

      const result = await forUser.KeypairApi.keypairsIdGet('my-id');

      expect(result).to.eql({
        keypair: {
          id: 'my-id',
          public_key: 'public-key-of-it',
          encrypted_serialized_key: 'encrypted-key',
          metadata: {},
          external_identifiers: [],
        },
      });
    });

    it('mixes any user-defined headers with the default ones', async () => {
      nock('https://meeco-keystore.example.com/')
        .get('/keypairs/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-keystore-token')
        .matchHeader('X_MY_CUSTOM_HEADER', 'foo')
        .reply(200, {
          keypair: {
            id: 'my-id',
            public_key: 'public-key-of-it',
            encrypted_serialized_key: 'encrypted-key',
            metadata: {},
            external_identifiers: [],
          },
        });
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com',
        },
      });
      const forUser = apiFactory(
        <any>{
          keystore_access_token: 'my-keystore-token',
        },
        {
          X_MY_CUSTOM_HEADER: 'foo',
        }
      );
      const result = await forUser.KeypairApi.keypairsIdGet('my-id');

      expect(result).to.eql({
        keypair: {
          id: 'my-id',
          public_key: 'public-key-of-it',
          encrypted_serialized_key: 'encrypted-key',
          metadata: {},
          external_identifiers: [],
        },
      });
    });

    it('captures api version issues and throws a special error', async () => {
      nock('https://meeco-keystore.example.com/').get('/keypairs/my-id').reply(426);
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com',
        },
      });
      const forUser = apiFactory(
        <any>{
          keystore_access_token: 'my-keystore-token',
        },
        {
          X_MY_CUSTOM_HEADER: 'foo',
        }
      );
      let error;
      try {
        const result = await forUser.KeypairApi.keypairsIdGet('my-id');
        expect(result).to.eql({
          status: 'ok',
        });
      } catch (err) {
        error = err;
      }
      expect(error.message).to.include(
        'The API returned 426 and therefore does not support this version of the CLI. Please check for an update to the Meeco CLI'
      );
    });
  });

  describe('vaultAPIFactory', () => {
    it('adds the required authorization headers and default version headers to request methods', async () => {
      nock('https://meeco-vault.example.com/')
        .get('/items/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-vault-token')
        .reply(200, {
          attachments: [],
          classification_nodes: [],
          shares: [],
          slots: [],
          thumbnails: [],
        });
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com',
        },
      });
      const forUser = apiFactory(<any>{
        vault_access_token: 'my-vault-token',
      });
      const result = await forUser.ItemApi.itemsIdGet('my-id');
      // tslint:disable-next-line
      expect(result).to.be.ok;
    });

    it('mixes any user-defined headers with the default ones', async () => {
      nock('https://meeco-vault.example.com/')
        .get('/items/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-vault-token')
        .matchHeader('X_MY_CUSTOM_HEADER', 'foo')
        .reply(200, {
          attachments: [],
          classification_nodes: [],
          shares: [],
          slots: [],
          thumbnails: [],
        });
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com',
        },
      });
      const forUser = apiFactory(
        <any>{
          vault_access_token: 'my-vault-token',
        },
        {
          X_MY_CUSTOM_HEADER: 'foo',
        }
      );
      const result = await forUser.ItemApi.itemsIdGet('my-id');
      expect(result).to.eql({
        item: undefined,
        attachments: [],
        classification_nodes: [],
        slots: [],
        thumbnails: [],
      });
    });

    it('captures api version issues and throws a special error', async () => {
      nock('https://meeco-vault.example.com/').get('/items/my-id').reply(426);
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com',
        },
      });
      const forUser = apiFactory(<any>{
        vault_access_token: 'my-vault-token',
      });
      let error;
      try {
        const result = await forUser.ItemApi.itemsIdGet('my-id');
        expect(result).to.eql({
          status: 'ok',
        });
      } catch (err) {
        error = err;
      }
      expect(error.message).to.include(
        'The API returned 426 and therefore does not support this version of the CLI. Please check for an update to the Meeco CLI'
      );
    });
  });
});

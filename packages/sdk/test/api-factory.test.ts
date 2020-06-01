import { expect } from '@oclif/test';
import * as nock from 'nock';
import { keystoreAPIFactory, vaultAPIFactory } from '../src/util/api-factory';

describe('API Factories', () => {
  afterEach(() => {
    nock.cleanAll();
  });
  describe('keystoreAPIFactory', () => {
    it('adds the required authorization headers and default version headers to request methods', async () => {
      nock('https://meeco-keystore.example.com/')
        .get('/keypairs/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-keystore-token')
        .matchHeader('X_MEECO_API_VERSION', '2.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'keystore')
        .reply(200, {
          status: 'ok'
        });
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com'
        }
      });
      const forUser = apiFactory(<any>{
        keystore_access_token: 'my-keystore-token'
      });
      const result = await forUser.KeypairApi.keypairsIdGet('my-id');
      expect(result).to.eql({
        status: 'ok'
      });
    });

    it('mixes any user-defined headers with the default ones', async () => {
      nock('https://meeco-keystore.example.com/')
        .get('/keypairs/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-keystore-token')
        .matchHeader('X_MEECO_API_VERSION', '2.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'keystore')
        .matchHeader('X_MY_CUSTOM_HEADER', 'foo')
        .reply(200, {
          associations_to: [],
          associations: [],
          attachments: [],
          classification_nodes: [],
          shares: [],
          slots: [],
          thumbnails: []
        });
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com'
        }
      });
      const forUser = apiFactory(<any>{
        keystore_access_token: 'my-keystore-token'
      });
      const result = await forUser.KeypairApi.keypairsIdGet('my-id', {
        headers: {
          X_MY_CUSTOM_HEADER: 'foo'
        }
      });
      // tslint:disable-next-line
      expect(result).to.be.ok;
    });

    it('captures api version issues and throws a special error', async () => {
      nock('https://meeco-keystore.example.com/')
        .get('/keypairs/my-id')
        .reply(426);
      const apiFactory = keystoreAPIFactory(<any>{
        keystore: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-keystore.example.com'
        }
      });
      const forUser = apiFactory(<any>{
        keystore_access_token: 'my-keystore-token'
      });
      let error;
      try {
        const result = await forUser.KeypairApi.keypairsIdGet('my-id', {
          headers: {
            X_MY_CUSTOM_HEADER: 'foo'
          }
        });
        expect(result).to.eql({
          status: 'ok'
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
        .matchHeader('X_MEECO_API_VERSION', '2.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'vault')
        .reply(200, {
          associations_to: [],
          associations: [],
          attachments: [],
          classification_nodes: [],
          shares: [],
          slots: [],
          thumbnails: []
        });
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com'
        }
      });
      const forUser = apiFactory(<any>{
        vault_access_token: 'my-vault-token'
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
        .matchHeader('X_MEECO_API_VERSION', '2.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'vault')
        .matchHeader('X_MY_CUSTOM_HEADER', 'foo')
        .reply(200, {
          associations_to: [],
          associations: [],
          attachments: [],
          classification_nodes: [],
          shares: [],
          slots: [],
          thumbnails: []
        });
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com'
        }
      });
      const forUser = apiFactory(
        <any>{
          vault_access_token: 'my-vault-token'
        },
        {
          X_MY_CUSTOM_HEADER: 'foo'
        }
      );
      const result = await forUser.ItemApi.itemsIdGet('my-id');
      expect(result).to.eql({
        item: undefined,
        associations_to: [],
        associations: [],
        attachments: [],
        classification_nodes: [],
        shares: [],
        slots: [],
        thumbnails: []
      });
    });

    it('captures api version issues and throws a special error', async () => {
      nock('https://meeco-vault.example.com/')
        .get('/items/my-id')
        .reply(426);
      const apiFactory = vaultAPIFactory(<any>{
        vault: {
          subscription_key: 'my_sub_key',
          url: 'https://meeco-vault.example.com'
        }
      });
      const forUser = apiFactory(<any>{
        vault_access_token: 'my-vault-token'
      });
      let error;
      try {
        const result = await forUser.ItemApi.itemsIdGet('my-id');
        expect(result).to.eql({
          status: 'ok'
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

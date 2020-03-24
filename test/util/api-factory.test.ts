import { expect } from '@oclif/test';
import * as nock from 'nock';
import { keystoreAPIFactory, vaultAPIFactory } from '../../src/util/api-factory';

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
        .matchHeader('X_MEECO_API_VERSION', '3.0.0')
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
        .matchHeader('X_MEECO_API_VERSION', '3.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'keystore')
        .matchHeader('X_MY_CUSTOM_HEADER', 'foo')
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
      const result = await forUser.KeypairApi.keypairsIdGet('my-id', {
        headers: {
          X_MY_CUSTOM_HEADER: 'foo'
        }
      });
      expect(result).to.eql({
        status: 'ok'
      });
    });
  });

  describe('vaultAPIFactory', () => {
    it('adds the required authorization headers and default version headers to request methods', async () => {
      nock('https://meeco-vault.example.com/')
        .get('/items/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-vault-token')
        .matchHeader('X_MEECO_API_VERSION', '3.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'vault')
        .reply(200, {
          status: 'ok'
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
      expect(result).to.eql({
        status: 'ok'
      });
    });

    it('mixes any user-defined headers with the default ones', async () => {
      nock('https://meeco-vault.example.com/')
        .get('/items/my-id')
        .matchHeader('Meeco-Subscription-Key', 'my_sub_key')
        .matchHeader('Authorization', 'my-vault-token')
        .matchHeader('X_MEECO_API_VERSION', '3.0.0')
        .matchHeader('X_MEECO_API_COMPONENT', 'vault')
        .matchHeader('X_MY_CUSTOM_HEADER', 'bar')
        .reply(200, {
          status: 'ok'
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
      const result = await forUser.ItemApi.itemsIdGet('my-id', {
        headers: {
          X_MY_CUSTOM_HEADER: 'bar'
        }
      });
      expect(result).to.eql({
        status: 'ok'
      });
    });
  });
});

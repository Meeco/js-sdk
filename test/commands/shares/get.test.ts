import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import * as nock from 'nock';
import { customTest, outputFixture, testEnvironmentFile, testUserAuth } from '../../test-helpers';

describe('shares:get', () => {
  customTest
    .stdout()
    .stderr()
    .mockCryppo()
    .nock('https://sandbox.meeco.me/vault', mockVault)
    .nock('https://sandbox.meeco.me/keystore', mockKeystore)
    .run(['shares:get', ...testUserAuth, ...testEnvironmentFile, 'share_1'])
    .it('lists the decrypted slots from a shared item', ctx => {
      const expected = readFileSync(outputFixture('get-shares.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected);
    });
});

function mockVault(api: nock.Scope) {
  // Will verify that the connection exists and the key is claimed
  api
    .get('/connections/con_1')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      connection: {
        id: 'con_1',
        encryption_space_id: 'encryption_space_id'
      }
    });

  api
    .get('/shares/share_1')
    .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      share: {
        id: 'sh_1',
        connection_id: 'con_1',
        shareable_id: 'it_1',
        encryption_space_id: 'es_1',
        encrypted_values: {
          sl_1: 'encrypted_fluffy',
          sl_2: 'encrypted_12'
        }
      },
      item: {
        id: 'it_1',
        label: 'My Cat',
        encrypted: true,
        slot_ids: ['sl_1', 'sl_2']
      },
      slots: [
        {
          id: 'sl_1',
          label: 'name',
          encrypted: true,
          // The API will return null as the encrypted_values on the share are to be used
          encrypted_value: null
        },
        {
          id: 'sl_2',
          label: 'age',
          encrypted: true,
          // The API will return null as the encrypted_values on the share are to be used
          encrypted_value: null
        }
      ]
    });
}

function mockKeystore(api: nock.Scope) {
  api
    .get('/encryption_spaces/es_1')
    .matchHeader('Authorization', 'a2V5c3RvcmVfYXV0aF90b2tlbg==')
    .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
    .reply(200, {
      encryption_space_data_encryption_key: {
        serialized_data_encryption_key: 'secret_shared_key'
      }
    });
}

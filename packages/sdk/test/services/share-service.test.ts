import { bytesToBinaryString, encodeSafe64 } from '@meeco/cryppo';
import {
  AcceptanceRequest,
  ConnectionService,
  DecryptedItem,
  ItemService,
  ShareService,
  ShareType,
  SlotHelpers,
  SymmetricKey,
} from '@meeco/sdk';
import {
  Connection,
  Share,
  ShareAcceptanceRequiredEnum,
  SharesIncomingResponse,
  SharesOutgoingResponse,
} from '@meeco/vault-api-sdk';
import { expect } from 'chai';
import sinon from 'sinon';
import { default as itemResponse } from '../fixtures/responses/item-response/basic';
import { customTest, environment, testUserAuth } from '../test-helpers';

describe('ShareService', () => {
  describe('#shareItem', () => {
    let service: ShareService;
    const itemId = itemResponse.item.id;
    const connectionId = '123';
    const fakePublicKey = '-----BEGIN PUBLIC KEY-----ABCD';

    beforeEach(() => {
      service = new ShareService(environment);
    });

    const connectionStub = customTest.mockCryppo().stub(
      ConnectionService.prototype,
      'get',
      sinon
        .stub()
        .withArgs(connectionId)
        .returns({
          the_other_user: { user_public_key: fakePublicKey, user_keypair_external_id: '123' },
        })
    );

    connectionStub
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/items/${itemId}`).reply(200, itemResponse);
        api.post(`/items/${itemId}/shares`).reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId))
      .it('shares an item');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.post(`/items/${itemId}/shares`).reply(201, { shares: [] });
      })
      .do(async () =>
        service.shareItem(
          testUserAuth,
          {
            own: {},
            the_other_user: {
              user_public_key: fakePublicKey,
              user_keypair_external_id: '123',
              user_id: '123',
            },
          } as Connection,
          await DecryptedItem.fromAPI(testUserAuth, itemResponse)
        )
      )
      .it('accepts Item and Connection object params');

    connectionStub
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/items/${itemId}`).reply(200, itemResponse);
        api
          .post(`/items/${itemId}/shares`, body =>
            body.shares[0].encrypted_dek.endsWith(`[with ${fakePublicKey}]`)
          )
          .reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId))
      .it('encrypts the DEK with the share public key');

    const nullSlotId = '123';
    const itemWithNull = {
      ...itemResponse,
      item: {
        ...itemResponse.item,
      },
    };
    itemWithNull.item.slot_ids = itemWithNull.item.slot_ids.concat(nullSlotId);
    itemWithNull.slots = itemWithNull.slots.concat({
      ...itemResponse.slots[0],
      id: nullSlotId,
      encrypted_value: null,
    });

    connectionStub
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/items/${itemId}`)
          .reply(200, itemWithNull)
          .post(`/items/${itemId}/shares`, body =>
            body.shares[0].slot_values.every(({ slot_id }) => slot_id !== nullSlotId)
          )
          .reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId))
      .it('slots with null values are not included in POST body');

    connectionStub
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/items/${itemId}`).reply(200, itemResponse);
        api
          .post(
            `/items/${itemId}/shares`,
            body =>
              body.shares[0].slot_id === 'pizza' &&
              body.shares[0].slot_values[0].slot_id === 'pizza' &&
              body.shares[0].slot_values.length === 1
          )
          .reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId, { slot_id: 'pizza' }))
      .it('shares a single slot');

    connectionStub
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/items/${itemId}`).reply(200, itemResponse);
        api
          .post(
            `/items/${itemId}/shares`,
            body =>
              body.shares[0].slot_id === 'pizza' &&
              body.shares[0].slot_values[0].slot_id === 'pizza' &&
              body.shares[0].slot_values[0].encrypted_value ===
                '[serialized][encrypted]Hawaiian[decrypted with my_generated_dek][with randomly_generated_key]'
          )
          .reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId, { slot_id: 'pizza' }))
      .it('single slot is encrypted with the share DEK');

    connectionStub
      .stub(
        SlotHelpers,
        'toEncryptedSlotValue',
        sinon.fake<any, any>((cred, slot) => ({
          ...slot,
          value: 'abc',
          value_verification_key: SymmetricKey.fromSerialized(encodeSafe64('123')),
          value_verification_hash: '123',
        }))
      )
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/items/${itemId}`).reply(200, itemResponse);
        api
          .post(`/items/${itemId}/shares`, body =>
            body.shares[0].slot_values.every(
              slot =>
                slot.encrypted_value_verification_key ===
                '[serialized][encrypted]123[with randomly_generated_key]'
            )
          )
          .reply(201, { shares: [] });
      })
      .do(() => service.shareItem(testUserAuth, connectionId, itemId))
      .it('re-encrypts value verification key when on-sharing');
  });

  describe('#acceptIncomingShare', () => {
    const shareId = '123';

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.put(`/incoming_shares/${shareId}/accept`).reply(201, { share: {} });
      })
      .do(() => new ShareService(environment).acceptIncomingShare(testUserAuth, shareId))
      .it('calls PUT /incoming_shares/id/accept');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.put(`/incoming_shares/${shareId}/accept`).reply(404);
      })
      .do(() => new ShareService(environment).acceptIncomingShare(testUserAuth, shareId))
      .catch(`Share with id '${shareId}' not found for the specified user`)
      .it('throws an error when share does not exist');
  });

  describe('#deleteSharedItem', () => {
    const shareId = '123';

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.delete(`/shares/${shareId}`).reply(200);
      })
      .do(() => new ShareService(environment).deleteSharedItem(testUserAuth, shareId))
      .it('calls DELETE /shares/id');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.delete(`/shares/${shareId}`).reply(404);
      })
      .do(() => new ShareService(environment).deleteSharedItem(testUserAuth, shareId))
      .catch(`Share with id '${shareId}' not found for the specified user`)
      .it('throws an error when share does not exist');
  });

  describe('#getShareDEK', () => {
    const keypairId = '123';
    const dek = 'pineapple';
    const publicKey = '-----BEGIN PUBLIC KEY-----ABCD';
    const privateKey = '-----BEGIN RSA PRIVATE KEY-----ABCD';

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/keystore', api => {
        api.get(`/keypairs/${keypairId}`).reply(200, {
          keypair: {
            public_key: publicKey,
            encrypted_serialized_key: privateKey,
          },
        });
      })
      .add('result', () =>
        new ItemService(environment).getShareDEK(testUserAuth, {
          encrypted_dek: dek,
          keypair_external_id: keypairId,
        } as Share)
      )
      .it('decrypts a shared DEK using the correct keypair', ({ result }) => {
        expect(bytesToBinaryString(result.key)).to.equal(
          `[decrypted]${dek}${privateKey}[decrypted with ${bytesToBinaryString(
            testUserAuth.key_encryption_key.key
          )}]`
        );
      });

    customTest
      .mockCryppo()
      .add('result', () =>
        new ItemService(environment).getShareDEK(testUserAuth, {
          encrypted_dek: null,
          keypair_external_id: keypairId,
        } as Share)
      )
      .it('returns the users private key when item is re-encrypted', ({ result }) => {
        expect(result.key).to.equal(testUserAuth.data_encryption_key.key);
      });
  });

  describe('#getSharedItem', () => {
    const shareId = '123';
    const otherShareId = '456';

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/incoming_shares/${shareId}/item`).reply(200, {
          ...itemResponse,
          share: {
            item_id: itemResponse.item.id,
            acceptance_required: 'accepted',
          },
        });
      })
      .stub(
        ItemService.prototype,
        'getShareDEK',
        sinon.stub().returns(SymmetricKey.fromSerialized(encodeSafe64('some_key')))
      )
      .do(() => new ShareService(environment).getSharedItem(testUserAuth, shareId))
      .it('calls GET /incoming_shares/id/item by default');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/outgoing_shares/${shareId}`)
          .reply(200, { share: { item_id: itemResponse.item.id } });
        api.get(`/items/${itemResponse.item.id}`).reply(200, itemResponse);
      })
      .do(() =>
        new ShareService(environment).getSharedItem(testUserAuth, shareId, ShareType.Outgoing)
      )
      .it('gets an outgoing shared item');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/incoming_shares/${shareId}/item`).reply(200, {
          ...itemResponse,
          share: {
            item_id: itemResponse.item.id,
            acceptance_required: AcceptanceRequest.Required,
          },
        });
      })
      .do(() => new ShareService(environment).getSharedItem(testUserAuth, shareId))
      .catch(e => expect(e).to.be.ok)
      .it('does not decrypt the Item if it is not accepted');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/incoming_shares/${shareId}/item`).reply(200, {
          ...itemResponse,
          share: {
            item_id: itemResponse.item.id,
            acceptance_required: AcceptanceRequest.NotRequired,
          },
        });
      })
      .do(() => new ShareService(environment).getSharedItem(testUserAuth, shareId))
      .it('decrypts if acceptance is not required');

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/incoming_shares/${shareId}/item`).reply(200, {
          ...itemResponse,
          share: {
            item_id: itemResponse.item.id,
            acceptance_required: 'accepted',
          },
          item_shared_via_another_share_id: otherShareId,
        });

        api.get(`/incoming_shares/${otherShareId}/item`).reply(200, {
          ...itemResponse,
          share: {
            item_id: itemResponse.item.id,
            acceptance_required: 'accepted',
          },
        });
      })
      .stub(
        ItemService.prototype,
        'getShareDEK',
        sinon.stub().returns(SymmetricKey.fromSerialized(encodeSafe64('some_key')))
      )
      .do(() => new ShareService(environment).getSharedItem(testUserAuth, shareId))
      .it('retrieves the original if an item was already shared');

    customTest
      .nock('https://sandbox.meeco.me/vault', api => {
        api.get(`/incoming_shares/${shareId}/item`).reply(404);
      })
      .do(() => new ShareService(environment).getSharedItem(testUserAuth, shareId))
      .catch(`Share with id '${shareId}' not found for the specified user`)
      .it('throws an error when share does not exist');
  });

  describe('#updateSharedItem', () => {
    const shareId = '123';
    customTest
      .mockCryppo()
      .stub(ItemService.prototype, 'get', sinon.stub().resolves({ isOwned: () => false }))
      .do(() => new ShareService(environment).updateSharedItem(testUserAuth, shareId))
      .catch(/^Only Item owner can update.*/)
      .it('does not update a received Item');

    const fakePublicKey = '-----BEGIN PUBLIC KEY-----ABCD';

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        api
          .get(`/items/${shareId}/shares`)
          .reply(200, { shares: [{ id: '123', public_key: fakePublicKey }] });
        api
          .put(
            `/items/${shareId}/shares`,
            body =>
              body.share_deks[0].share_id === '123' &&
              body.share_deks[0].dek.endsWith(`[with ${fakePublicKey}]`) &&
              body.slot_values.every(
                slot =>
                  slot.encrypted_value.endsWith('[with randomly_generated_key]') &&
                  slot.encrypted_value_verification_key.endsWith('[with randomly_generated_key]')
              )
          )
          .reply(201, { shares: [] });
      })
      .stub(
        ItemService.prototype,
        'get',
        sinon.fake(() => DecryptedItem.fromAPI(testUserAuth, itemResponse))
      )
      .do(() => new ShareService(environment).updateSharedItem(testUserAuth, shareId))
      .it('sends the update');
  });

  describe('#listShares', () => {
    const response: SharesIncomingResponse & SharesOutgoingResponse = {
      shares: [
        {
          id: '65b3c3c1-fe2b-48b6-8002-46be46c6d7f7',
          owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
          sender_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
          recipient_id: 'da5b0a98-4ef7-4cb7-889b-f17c77e94adc',
          acceptance_required: ShareAcceptanceRequiredEnum.AcceptanceRequired,
          item_id: '2c9b15f1-7b28-44af-9fe0-70e3ea308c0c',
          slot_id: null,
          public_key: '-----BEGIN PUBLIC KEY-----ABCD',
          onsharing_permitted: true,
          keypair_external_id: 'edff1a41-5cc9-45ef-8800-20948c86fd5c',
          encrypted_dek: null,
          terms: null,
          created_at: new Date(1),
          expires_at: null,
        },
        {
          id: '9ff995b7-660a-433a-9c84-809eda70db7f',
          owner_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
          sender_id: '1c84f97a-877f-4f50-a85e-838c27750c95',
          recipient_id: 'da5b0a98-4ef7-4cb7-889b-f17c77e94adc',
          acceptance_required: ShareAcceptanceRequiredEnum.AcceptanceNotRequired,
          item_id: '325f5e77-c670-4ecf-a4d9-84bcc6c9e46e',
          slot_id: null,
          public_key: '-----BEGIN PUBLIC KEY-----ABCD',
          onsharing_permitted: false,
          keypair_external_id: 'edff1a41-5cc9-45ef-8800-20948c86fd5c',
          encrypted_dek:
            'Rsa4096.omdqu-um6RWbqcCOBwk6-9FVY1tAlkjCD1tU7i1l94vLksE2K4PsuFqbM5QLJdHj7mShKywCCC18LW7ShTj7wXI9L9dRcqVhSZCd4fAS_BK-r0Mi9MeS6284zPjW26KIetu28pIdfUZOLhmiWmSq_xUvbx7wqAahFrHuHfjfl7UKd1lnaWabMQe7GbL0giJWhFliHtTOF2h74nqWnHwYT-sqJLyECacUb3N5p6ySKzv0Vjqf7CWu-lW6rsL0c2_VoRQTBZSBNyWx98Ig3dQHGVYgs1c__94M4w5TLY0QrCZWUcrqlwik7QpJQhCPioQGM32xRMxBi584TfqPQ_KmImAr7H9Rh-EW39fhH_7cqnYpvvZYNl1FYrF4GIvb_EVmqjIILpFLuhtmXuu8NLXUAy2-BpgJteqOLM0sqnMoeayuQQxO1OZJ38GYcHTTUPCoEnRfkTsQMJOuZq7PjC_PpWP1MsG3WfY4haBHvhqN0CcPS-TpcDPqcDwAxaEADHOTvl6WdorTLjO6mV2WLQfrQfMbFQ4Kkrt_YB-gm-_PCw-04o27amg59Tzu3HnPijb27GnfV3yMv_jGiY-_wK98evxNHDbvApk97LQXvLVmyO-_DLlkSnBvByLlf2CZwFOWvxqUTRchlRtjLDX7Cw7GQqBnuzEplP5LZ9QhnLAUQfU=.QQUAAAAA',
          terms: null,
          created_at: new Date(1),
          expires_at: null,
        },
      ],
      next_page_after: '3',
      meta: [],
    };

    // Incoming shares
    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api.get('/incoming_shares').reply(200, response)
      )
      .do(() => new ShareService(environment).listShares(testUserAuth))
      .it('calls GET /incoming_shares by default');

    // outgoing shares
    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api.get('/outgoing_shares').reply(200, response)
      )
      .do(() => new ShareService(environment).listShares(testUserAuth, ShareType.Outgoing))
      .it('calls GET /outgoing_shares when passed a param');
  });
});

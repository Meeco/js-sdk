import { ItemUpdate, NewItem, NewSlot, SlotType } from '@meeco/sdk';
import { ItemApi, ItemResponse } from '@meeco/vault-api-sdk';
import { expect } from '@oclif/test';
import { ItemService } from '../../src/services/item-service';
import { MOCK_NEXT_PAGE_AFTER } from '../constants';
import { default as MockItemResponse } from '../fixtures/responses/item-response/basic';
import {
  customTest,
  environment,
  getInputFixture,
  getOutputFixture,
  replaceUndefinedWithNull,
  testUserAuth,
} from '../test-helpers';

describe('ItemService', () => {
  describe('#create', () => {
    function createItem({ template_name, item }) {
      const slot_ids = ['a', 'b', 'c', 'd', 'e'];
      const update = { ...item };
      if (template_name === 'vehicle') {
        update.slots_attributes = [
          {
            id: 'a',
            name: 'Make',
          },
          {
            id: 'b',
            name: 'Model',
          },
        ];
      }
      const slots = (update.slots_attributes || []).map((slot, index) => ({
        ...slot,
        id: slot_ids[index],
      }));
      delete update.slots_attributes;
      return Promise.resolve({
        item: {
          id: 'item-foo',
          template_name,
          ...update,
          slot_ids: slots.map(slot => slot.id),
        },
        slots,
      });
    }

    customTest
      .stub(ItemApi.prototype, 'itemsPost', createItem as any)
      .add('input', () => getInputFixture('create-item-from-template.input.json'))
      .add('expected', () => getOutputFixture('create-item-from-template.output.json'))
      .it('creates an empty item given template_name and label', async ({ input, expected }) => {
        const item = new NewItem(input.label, input.template_name, []);
        const result = await new ItemService(environment).create(testUserAuth, item);

        const { slots, ...expectedItem } = expected;
        expect(result.item).to.eql(expectedItem);
        expect(result.slots).to.deep.members(slots);
      });

    customTest
      .stub(ItemApi.prototype, 'itemsPost', createItem as any)
      .mockCryppo()
      .add('input', () => getInputFixture('create-item-with-slots.input.json'))
      .add('expected', () => getOutputFixture('create-item-with-slots.output.json'))
      .it('creates an item with slots provided in a config file', async ({ input, expected }) => {
        const itemCreateData = new NewItem(
          input.label,
          input.template_name,
          input.slots as NewSlot[]
        );
        const result = await new ItemService(environment).create(testUserAuth, itemCreateData);

        const { slots, ...expectedItem } = expected;
        expect(result.item).to.eql(expectedItem);
        expect(result.slots).to.deep.members(slots);
      });
  });

  describe('#get', () => {
    function getItem(item: ItemResponse) {
      return api => {
        api
          .get('/items/my-item')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, item);
      };
    }

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', getItem(MockItemResponse))
      .add('result', () => new ItemService(environment).get(testUserAuth, 'my-item'))
      .it('returns an item with all slots decrypted', async ({ result }) => {
        for (const s of result.slots) {
          if (s.value) {
            expect(s.value).to.match(/.*\[decrypted with my_generated_dek\]$/);
          }
        }
      });

    // gets a shared item
    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        getItem({
          ...MockItemResponse,
          item: {
            ...MockItemResponse.item,
            share_id: 'shareId',
          },
        })(api);

        api
          .get('/incoming_shares/shareId')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, { share: { keypair_external_id: 'id', encrypted_dek: 'dek' } });
      })
      .nock('https://sandbox.meeco.me/keystore', api => {
        api
          .get('/keypairs/id')
          .matchHeader('Authorization', testUserAuth.keystore_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.keystore.subscription_key)
          .reply(200, {
            keypair: {
              public_key: '-----BEGIN PUBLIC KEY-----ABCD',
              encrypted_serialized_key: '-----BEGIN RSA PRIVATE KEY-----ABCD',
              external_identifiers: ['id'],
            },
          });
      })
      .it('decrypts a shared item encrypted with a shared DEK', async () => {
        const result = await new ItemService(environment).get(testUserAuth, 'my-item');

        expect(replaceUndefinedWithNull(result.slots[0].value)).to.match(
          /[^\[]+\[decrypted with \[decrypted\]dek.*\[decrypted with my_key_encryption_key\]\]$/
        );
      });

    // gets a shared item that has been re-encrypted
    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api => {
        getItem({
          ...MockItemResponse,
          item: {
            ...MockItemResponse.item,
            share_id: 'shareId',
          },
        })(api);

        api
          .get('/incoming_shares/shareId')
          .matchHeader('Authorization', testUserAuth.vault_access_token)
          .matchHeader('Meeco-Subscription-Key', environment.vault.subscription_key)
          .reply(200, { share: { keypair_external_id: 'id', encrypted_dek: null } });
      })
      .it('decrypts a shared item encrypted with personal DEK', async () => {
        const result = await new ItemService(environment).get(testUserAuth, 'my-item');

        expect(replaceUndefinedWithNull(result.slots[0].value)).to.match(
          /[^\[]+\[decrypted with my_generated_dek\]$/
        );
      });
  });

  describe('#list', () => {
    const response = {
      items: [
        {
          id: 'a',
          name: 'My Car',
          slot_ids: ['make_model'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'b',
          name: 'My House',
          slot_ids: ['add'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      slots: [
        {
          id: 'make_model',
          name: 'Make and Model',
          value: 'Tesla Model S',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'add',
          name: 'address',
          value: '123 Fake Street',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
      meta: [],
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get('/items')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, response)
      )
      .it('list items that the user has', async () => {
        const result = await new ItemService(environment).list(testUserAuth);

        const expected = getOutputFixture('list-items.output.json');
        expect(replaceUndefinedWithNull(result.items)).to.deep.members(expected);
      });
  });

  describe('#listAll', () => {
    const response = {
      items: [
        {
          id: 'a',
          name: 'My Car',
          slot_ids: ['make_model'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'b',
          name: 'My House',
          slot_ids: ['add'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      slots: [
        {
          id: 'make_model',
          name: 'Make and Model',
          value: 'Tesla Model S',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'add',
          name: 'address',
          value: '123 Fake Street',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
      meta: [],
    };

    const responsePart1 = {
      ...response,
      items: [response.items[0]],
      slots: [response.slots[0]],
      next_page_after: MOCK_NEXT_PAGE_AFTER,
      meta: [{ next_page_exists: true }],
    };

    const responsePart2 = {
      ...response,
      items: [response.items[1]],
      slots: [response.slots[1]],
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get('/items')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, responsePart1)
          .get('/items')
          .query({ next_page_after: MOCK_NEXT_PAGE_AFTER })
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, responsePart2)
      )
      .it('list items that the user has', async () => {
        const result = await new ItemService(environment).listAll(testUserAuth);

        const expected = getOutputFixture('list-items.output.json');
        expect(replaceUndefinedWithNull(result.items)).to.deep.members(expected);
      });
  });

  describe('#listDecrypted', () => {
    const mockResponse = {
      items: [
        {
          id: 'a',
          name: 'My Car',
          slot_ids: ['make_model'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'b',
          name: 'My House',
          slot_ids: ['add'],
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      slots: [
        {
          id: 'make_model',
          name: 'Make and Model',
          encrypted_value: 'value',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
        {
          id: 'add',
          name: 'address',
          encrypted_value: 'value',
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
      meta: [],
    };

    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get('/items')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, {
            ...mockResponse,
            items: [],
            slots: [],
          })
      )
      .add('response', async () => await new ItemService(environment).listDecrypted(testUserAuth))
      .it('works for no items', ({ response }) => {
        // tslint:disable-next-line:no-unused-expression
        expect(response.items).to.be.empty;
        // tslint:disable-next-line:no-unused-expression
        expect(response.meta).to.be.empty;
      });

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .get('/items')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(200, mockResponse)
      )
      .add('response', async () => await new ItemService(environment).listDecrypted(testUserAuth))
      .it('list items and decrypts their slots', ({ response }) => {
        expect(response.items.length).to.equal(2);
        for (const i of response.items) {
          for (const s of i.slots) {
            expect(s.value).to.match(/^.+\[decrypted with .+\]$/);
          }
        }
      });
  });

  describe('ItemService.removeSlot', () => {
    customTest
      .nock('https://sandbox.meeco.me/vault', api =>
        api
          .delete('/slots/my_slot_id')
          .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
          .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
          .reply(204)
      )
      .it('removes a slot from an item', async () => {
        await new ItemService(environment).removeSlot(testUserAuth, 'my_slot_id');
      });
  });

  describe('#update', () => {
    const response = {
      item: {
        created_at: new Date(1),
        updated_at: new Date(1),
        label: 'My Fave Foods',
        name: 'food',
        slot_ids: ['pizza'],
      },
      slots: [
        {
          id: 'pizza',
          label: 'Pizza',
          name: 'pizza',
          foo: 'bar',
          slot_type_name: SlotType.KeyValue,
          encrypted_value: 'Supreme',
          encrypted: true,
          created_at: new Date(1),
          updated_at: new Date(1),
        },
      ],
      attachments: [],
      classification_nodes: [],
      shares: [],
      thumbnails: [],
    };

    function mockVault(api) {
      api
        .put('/items/my-item', {
          item: {
            label: 'My Fave Foods',
            slots_attributes: [
              {
                name: 'pizza',
                encrypted_value: '[serialized][encrypted]Supreme[with my_generated_dek]',
              },
              {
                name: 'steak',
                _destroy: true,
              },
            ],
          },
        })
        .matchHeader('Authorization', '2FPN4n5T68xy78i6HHuQ')
        .matchHeader('Meeco-Subscription-Key', 'environment_subscription_key')
        .reply(200, response);
    }

    customTest
      .mockCryppo()
      .nock('https://sandbox.meeco.me/vault', mockVault)
      .it('Updates the item', async () => {
        const input = getInputFixture('update-item.input.json');
        const updateData = new ItemUpdate(input.id, {
          label: input.label,
          slots: input.slots,
        });
        const result = await new ItemService(environment).update(testUserAuth, updateData);

        const { slots: expectedSlots, thumbnails, attachments, ...expectedItem } = getOutputFixture(
          'update-item.output.json'
        );
        expect(replaceUndefinedWithNull(result.item)).to.eql(expectedItem);
        expect(replaceUndefinedWithNull(result.slots)).to.deep.members(expectedSlots);
      });
  });
});

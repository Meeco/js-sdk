import { DecryptedItem, EncryptionKey, SlotHelpers } from '@meeco/sdk';
import { Attachment, Slot } from '@meeco/vault-api-sdk';
import { expect } from 'chai';
import sinon from 'sinon';
import { default as BasicItem } from '../fixtures/responses/item-response/basic';
import { default as OwnedItem } from '../fixtures/responses/item-response/owned';
import { default as ReceivedItem } from '../fixtures/responses/item-response/received';
import { customTest, mockClassificationNode, testUserAuth } from '../test-helpers';

describe('DecryptedItem', () => {
  describe('#fromAPI', () => {
    it('only stores slots which it uses', async () => {
      const response = {
        ...OwnedItem,
        slots: OwnedItem.slots.concat({ id: '0', name: 'ignore', label: 'ignore' } as Slot),
      };

      const item = await DecryptedItem.fromAPI(testUserAuth, response);
      for (const slot of item.slots) {
        expect(slot.id).to.not.equal('0');
      }
    });
  });

  describe('#classification_nodes', () => {
    it('just has the nodes applied to the Item', async () => {
      const badNode = mockClassificationNode('badId');
      const response = {
        ...OwnedItem,
        classification_nodes: OwnedItem.classification_nodes.concat(badNode),
      };

      const item = await DecryptedItem.fromAPI(testUserAuth, response);
      expect(item.classification_nodes).to.not.include(badNode);
    });

    it('applies classification nodes to slots');
  });

  describe('#toUpdateItem', () => {
    customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, BasicItem))
      .add('result', ({ item }) =>
        item.toUpdateItem({ slots: [{ name: 'pizza', value: 'quattro formaggi' }] })
      )
      .it('stores its id in the update', ({ item, result }) => {
        expect(result.id).to.equal(item.id);
      });
  });

  describe('#toShareSlots', () => {
    customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, OwnedItem))
      .add('result', ({ item }) => item.toShareSlots(testUserAuth, '123'))
      .it('inclues all slot ids in the parent, including null data', ({ item, result }) => {
        expect(result.map(({ slot_id }) => slot_id)).to.include.all.members(item.item.slot_ids);
        expect(result.length).to.equal(item.slots.length);
      });

    customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, BasicItem))
      .add('result', ({ item }) =>
        item.toShareSlots({ data_encryption_key: EncryptionKey.fromRaw('fake') }, '123')
      )
      .it('encrypts slot values with the given DEK', ({ item, result }) => {
        expect(result.map(({ encrypted_value }) => encrypted_value)).to.satisfy(values =>
          values.every(
            str =>
              str === undefined ||
              str.match(/^\[serialized\]\[encrypted\].*\[with fake\]$/) ||
              console.error(str)
          )
        );
      });

    customTest
      .mockCryppo()
      .stub(
        SlotHelpers,
        'decryptSlot',
        sinon.fake((key, slot) => ({
          id: slot.id,
          value: '123',
          value_verification_key: 'KEY',
          value_verification_hash: '123',
        }))
      )
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, ReceivedItem))
      .add('result', ({ item }) =>
        item.toShareSlots({ data_encryption_key: EncryptionKey.fromRaw('fake') }, '123')
      )
      .it('overwrites Slot value-verification key, if present', ({ result }) => {
        expect(result[0].encrypted_value_verification_key).to.equal(
          '[serialized][encrypted]randomly_generated_key[with fake]'
        );
      });

    customTest
      .mockCryppo()
      .stub(
        SlotHelpers,
        'decryptSlot',
        sinon.fake((key, slot) => ({
          id: slot.id,
          value: '123',
          value_verification_key: 'KEY',
          value_verification_hash: 'HASH',
        }))
      )
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, ReceivedItem))
      .add('result', ({ item }) =>
        item.toShareSlots({ data_encryption_key: EncryptionKey.fromRaw('fake') }, '123')
      )
      .it('generates a new value-verification key if none is given', ({ result }) => {
        expect(result[0].encrypted_value_verification_key).to.equal(
          '[serialized][encrypted]randomly_generated_key[with fake]'
        );
      });

    customTest
      .mockCryppo()
      .stub(
        SlotHelpers,
        'decryptSlot',
        sinon.fake((key, slot) => ({
          id: slot.id,
          value: '123',
          value_verification_key: 'KEY',
          value_verification_hash: 'STALE_HASH',
        }))
      )
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, ReceivedItem))
      .add('result', ({ item }) =>
        item.toShareSlots({ data_encryption_key: EncryptionKey.fromRaw('fake') }, '123')
      )
      .it('generates a new value-verification hash, overwriting the old', ({ result }) => {
        expect(result[0].value_verification_hash).to.not.match(/.*STALE_HASH.*/);
      });
  });

  // describe('#toEncryptedSlotValues');

  describe('boolean tests', () => {
    customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, OwnedItem))
      .it('recognizes an owned Item', async ({ item }) => {
        expect(item.isOwned()).to.equal(true);
        expect(item.isReceived()).to.equal(false);
      });

    customTest
      .stub(SlotHelpers, 'decryptSlot', sinon.stub().returns({}))
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, ReceivedItem))
      .it('recognizes a received Item', async ({ item }) => {
        expect(item.isOwned()).to.equal(false);
        expect(item.isReceived()).to.equal(true);
      });
  });

  describe('#getSlotAttachment', () => {
    it('works when there are no attachments', async () => {
      const item = await DecryptedItem.fromAPI(testUserAuth, OwnedItem);
      // tslint:disable-next-line:no-unused-expression
      expect(item.getSlotAttachment(item.slots[0])).to.be.undefined;

      const badSlot = {
        ...item.slots[0],
        attachment_id: '123',
      };
      // tslint:disable-next-line:no-unused-expression
      expect(item.getSlotAttachment(badSlot)).to.be.undefined;
    });

    it('finds the attachment', async () => {
      const id = '123';
      const fakeAttachment = { id } as Attachment;
      const item = await DecryptedItem.fromAPI(testUserAuth, {
        ...OwnedItem,
        attachments: [fakeAttachment],
      });

      const slotWithAttachment = {
        ...item.slots[0],
        attachment_id: id,
      };
      expect(item.getSlotAttachment(slotWithAttachment)).to.equal(fakeAttachment);
    });
  });

  describe('#getSlotClassifications', () => {
    customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, BasicItem))
      .it('works when there are no classification nodes', async ({ item }) => {
        expect(item.getSlotClassifications(item.slots[0]).length).to.equal(0);

        const badSlot = {
          ...item.slots[0],
          classification_node_ids: ['123'],
        };
        expect(item.getSlotClassifications(badSlot).length).to.equal(0);
      });

    it('finds the classification', async () => {
      // OwnedItem has classifications
      const item = await DecryptedItem.fromAPI(testUserAuth, OwnedItem);

      const nodeId = OwnedItem.classification_nodes[0].id;
      const slotWithClassification = {
        ...item.slots[0],
        classification_node_ids: [nodeId],
      };
      expect(item.getSlotClassifications(slotWithClassification)[0]?.id).to.equal(nodeId);
    });
  });
});

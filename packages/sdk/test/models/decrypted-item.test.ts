import { DecryptedItem, EncryptionKey } from '@meeco/sdk';
import { expect } from 'chai';
import sinon from 'sinon';
import { default as BasicItem } from '../fixtures/responses/item-response/basic';
import { default as OwnedItem } from '../fixtures/responses/item-response/owned';
import { default as ReceivedItem } from '../fixtures/responses/item-response/received';
import { customTest, mockClassificationNode, testUserAuth } from '../test-helpers';

describe('DecryptedItem', () => {
  describe('#fromAPI', () => {
    it('constructs the right thing');
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
  });

  describe('#toUpdateItem', () => {
    it('combines new slots with existing ones correctly');
  });

  describe('#toShareSlots', () => {
    const basicTest = customTest
      .mockCryppo()
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, OwnedItem))
      .add('result', ({ item }) => item.toShareSlots(testUserAuth, '123'));

    basicTest.it('inclues all slot ids in the parent, including null data', ({ item, result }) => {
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
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, BasicItem))
      .add('result', ({ item }) =>
        item.toShareSlots({ data_encryption_key: EncryptionKey.fromRaw('fake') }, '123')
      );

    it('re-encrypts vvk if present on slots');
    it('generates vvh and key if required and owned');
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
      .stub(DecryptedItem, 'decryptSlot', sinon.stub().returns({}))
      .add('item', () => DecryptedItem.fromAPI(testUserAuth, ReceivedItem))
      .it('recognizes a received Item', async ({ item }) => {
        expect(item.isOwned()).to.equal(false);
        expect(item.isReceived()).to.equal(true);
      });
  });

  describe('#getSlotAttachment', () => {
    it('works when there are no attachments');
    it('finds the attachment');
  });

  describe('#getSlotClassifications', () => {
    it('gets all classifications');
    it('gets no classifications');
  });
});

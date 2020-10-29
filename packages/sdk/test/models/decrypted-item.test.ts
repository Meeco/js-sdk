import { DecryptedItem } from '@meeco/sdk';
import { expect } from 'chai';
import { default as OwnedItem } from '../fixtures/responses/item-response/owned';
import { default as ReceivedItem } from '../fixtures/responses/item-response/received';
import { mockClassificationNode, testUserAuth } from '../test-helpers';

describe('DecryptedItem', () => {
  describe('#fromAPI', () => {
    it('constructs the right thing');
  });

  describe('#constructor', () => {
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
    it('has new nodes from any update');
  });

  // describe('#toUpdateRequest');
  // describe('#toShareSlots');
  // describe('#toEncryptedSlotValues');

  describe('boolean tests', () => {
    it('recognizes an owned Item', async () => {
      const item = await DecryptedItem.fromAPI(testUserAuth, OwnedItem);
      expect(item.isOwned()).to.equal(true);
      expect(item.isReceived()).to.equal(false);
    });

    it('recognizes a received Item', async () => {
      const item = await DecryptedItem.fromAPI(testUserAuth, ReceivedItem);
      expect(item.isOwned()).to.equal(false);
      expect(item.isReceived()).to.equal(true);
    });
  });
});

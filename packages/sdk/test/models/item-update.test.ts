import { IDEK, ItemUpdate } from '@meeco/sdk';
import { expect } from 'chai';
import { testUserAuth } from '../test-helpers';

describe('ItemUpdate', () => {
  describe('#constructor', () => {
    it('throws an Error when given an empty label', () => {
      expect(() => new ItemUpdate('itemId', { label: '' })).to.throw();
    });
  });

  describe('#toRequest', () => {
    let item: ItemUpdate;
    const dek: IDEK = testUserAuth;

    beforeEach(() => {
      item = new ItemUpdate('itemId', {});
    });

    it('encrypts any slots with values', async () => {
      item.slots = [
        { name: 'test_slot', value: 'abc' },
        { label: 'Test Slot 2', value: 'abc' },
      ];
      const result = await item.toRequest(dek);
      for (const slot of result.item!.slots_attributes!) {
        // tslint:disable-next-line:no-unused-expression
        expect(slot.encrypted_value).to.exist;
        // tslint:disable-next-line:no-unused-expression
        expect(slot.value).to.be.undefined;
      }
    });

    it('does not encrypt slots without values', async () => {
      item.slots = [{ name: 'empty_slot' }, { label: 'Another Empty Slot' }];
      const result = await item.toRequest(dek);
      expect(result.item!.slots_attributes!.length).to.equal(2);
      for (const slot of result.item!.slots_attributes!) {
        // tslint:disable-next-line:no-unused-expression
        expect(slot.encrypted_value).to.be.undefined;
        // tslint:disable-next-line:no-unused-expression
        expect(slot.value).to.be.undefined;
      }
    });

    it('throws an error if any slot has encrypted_value', async () => {
      item.slots = [{ name: 'empty_slot', encrypted_value: '' }];
      try {
        await item.toRequest(dek);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an('error');
      }
    });

    it('maps classification_nodes to classification_nodes_attributes correctly', async () => {
      const withNodes = new ItemUpdate('label', {
        classification_nodes: [
          {
            label: 'test',
          },
          { _destroy: true, label: 'example' },
        ],
      });
      const req = await withNodes.toRequest(dek);
      expect(req.item!.classification_nodes_attributes).to.eql([
        {
          label: 'test',
        },
        {
          _destroy: true,
          label: 'example',
        },
      ]);
    });

    // it('throws an error if there are duplicate slots', () => {
    //   const result = newItem.toRequest(dek);
    // });
  });
});

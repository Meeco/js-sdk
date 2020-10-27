import { EncryptionKey, NewItem } from '@meeco/sdk';
import { expect } from 'chai';
import { testUserAuth } from '../test-helpers';

describe('NewItem', () => {
  describe('#fromTemplate', () => {
    it('merges template slots and additional slots');
  });

  describe('#constructor', () => {
    it('throws an Error when given an empty label', () => {
      expect(() => new NewItem('', 'template')).to.throw();
    });
    it('throws an Error when given an empty template name', () => {
      expect(() => new NewItem('label', '')).to.throw();
    });
  });

  describe('#toRequest', () => {
    let newItem: NewItem;
    const dek: EncryptionKey = testUserAuth.data_encryption_key;

    beforeEach(() => {
      newItem = new NewItem('label', 'template');
    });

    it('encrypts any slots with values', async () => {
      newItem.slots = [
        { name: 'test_slot', value: 'abc' },
        { label: 'Test Slot 2', value: 'abc' },
      ];
      const result = await newItem.toRequest(dek);
      for (const slot of result.item!.slots_attributes!) {
        // tslint:disable-next-line:no-unused-expression
        expect(slot.encrypted_value).to.exist;
        // tslint:disable-next-line:no-unused-expression
        expect(slot.value).to.be.undefined;
      }
    });

    it('does not encrypt slots without values', async () => {
      newItem.slots = [{ name: 'empty_slot' }, { label: 'Another Empty Slot' }];
      const result = await newItem.toRequest(dek);
      expect(result.item!.slots_attributes!.length).to.equal(2);
      for (const slot of result.item!.slots_attributes!) {
        // tslint:disable-next-line:no-unused-expression
        expect(slot.encrypted_value).to.be.undefined;
        // tslint:disable-next-line:no-unused-expression
        expect(slot.value).to.be.undefined;
      }
    });

    it('throws an error if any slot has encrypted_value', async () => {
      newItem.slots = [{ name: 'empty_slot', encrypted_value: '' }];
      try {
        await newItem.toRequest(dek);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an('error');
      }
    });

    // it('throws an error if there are duplicate slots', () => {
    //   const result = newItem.toRequest(dek);
    // });
  });
});

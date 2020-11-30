import { EncryptionKey, NewItem, SlotType } from '@meeco/sdk';
import { ItemTemplate, Slot } from '@meeco/vault-api-sdk';
import { expect } from 'chai';
import { testUserAuth } from '../test-helpers';

describe('NewItem', () => {
  describe('#fromTemplate', () => {
    it('includes both template slots and additional slots', () => {
      const item = NewItem.fromTemplate(
        {
          name: 'food',
          slot_ids: ['steak', 'pizza', 'yoghurt'],
        } as ItemTemplate,
        [{ name: 'a_slot' } as Slot],
        'label',
        [{ name: 'another_slot', value: '123' }]
      );

      expect(item.slots.length).to.equal(2);
    });
  });

  describe('#constructor', () => {
    it('throws an Error when given an empty label', () => {
      expect(() => new NewItem('', 'template')).to.throw();
    });
    it('throws an Error when given an empty template name', () => {
      expect(() => new NewItem('label', '')).to.throw();
    });
  });

  describe('#assignValues', () => {
    let newItem: NewItem;

    beforeEach(() => {
      newItem = new NewItem('label', 'template');
    });

    it('creates new slots if none match', () => {
      newItem.assignValues({ new_slot: '123' });
      expect(newItem.slots[0].name).to.equal('new_slot');
      expect(newItem.slots[0].value).to.equal('123');
    });

    it('assigns to existing slots', () => {
      newItem.slots = [{ name: 'a_slot', value: '123' }];
      newItem.assignValues({ a_slot: '0' });
      expect(newItem.slots[0].value).to.equal('0');
    });

    it('matches by label', () => {
      newItem.slots = [{ label: 'A Slot', value: '123' }];
      newItem.assignValues({ a_slot: '0' });
      expect(newItem.slots[0].value).to.equal('0');
    });
  });

  describe('#set values', () => {
    let newItem: NewItem;

    beforeEach(() => {
      newItem = new NewItem('label', 'template');
    });

    it('creates new slots if none match', () => {
      newItem.values = { new_slot: '123' };
      expect(newItem.slots[0].name).to.equal('new_slot');
      expect(newItem.slots[0].value).to.equal('123');
    });

    it('preserves existing slot properties', () => {
      newItem.slots = [{ name: 'a_slot', value: '123', slot_type_name: SlotType.Email }];
      newItem.assignValues({ a_slot: '0' });
      expect(newItem.slots[0].slot_type_name).to.equal(SlotType.Email);
    });

    it('deletes slots', () => {
      newItem.slots = [{ label: 'A Slot', value: '123' }];
      newItem.values = {};
      expect(newItem.slots.length).to.equal(0);
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

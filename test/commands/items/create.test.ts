import { ItemApi } from '@meeco/meeco-api-sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth
} from '../../test-helpers';

describe('item:create', () => {
  customTest
    .stub(ItemApi.prototype, 'itemsPost', createItem)
    .stdout()
    .run([
      'items:create',
      ...testUserAuth,
      '-i',
      inputFixture('create-item-from-template.input.yaml')
    ])
    .it('creates an empty item from a template', ctx => {
      const expected = readFileSync(
        outputFixture('create-item-from-template.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stub(ItemApi.prototype, 'itemsPost', createItem)
    .mockCryppo()
    .stdout()
    .run([
      'items:create',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('create-item-with-slots.input.yaml')
    ])
    .it('creates an item with slots provided in a config file', ctx => {
      const expected = readFileSync(outputFixture('create-item-with-slots.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function createItem({ template_name, item }) {
  const slot_ids = ['a', 'b', 'c', 'd', 'e'];
  const update = { ...item };
  if (template_name === 'vehicle') {
    update.slots_attributes = [
      {
        id: 'a',
        name: 'Make'
      },
      {
        id: 'b',
        name: 'Model'
      }
    ];
  }
  const slots = (update.slots_attributes || []).map((slot, index) => ({
    ...slot,
    id: slot_ids[index]
  }));
  delete update.slots_attributes;
  return Promise.resolve({
    item: {
      id: 'item-foo',
      template_name,
      ...update,
      slot_ids: slots.map(slot => slot.id)
    },
    slots
  });
}

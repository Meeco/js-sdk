import { ItemService, NewItem } from '@meeco/sdk';
import { expect } from '@oclif/test';
import { readFileSync } from 'fs';
import {
  customTest,
  inputFixture,
  outputFixture,
  testEnvironmentFile,
  testUserAuth,
} from '../../test-helpers';

describe('item:create', () => {
  customTest
    .stub(ItemService.prototype, 'create', create as any)
    .stdout()
    .run([
      'items:create',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('create-item-from-template.input.yaml'),
    ])
    .it('creates an empty item from a template', ctx => {
      const expected = readFileSync(
        outputFixture('create-item-from-template.output.yaml'),
        'utf-8'
      );
      expect(ctx.stdout).to.contain(expected);
    });

  customTest
    .stub(ItemService.prototype, 'create', create as any)
    .mockCryppo()
    .stdout()
    .run([
      'items:create',
      ...testUserAuth,
      ...testEnvironmentFile,
      '-i',
      inputFixture('create-item-with-slots.input.yaml'),
    ])
    .it('creates an item with slots provided in a config file', ctx => {
      const expected = readFileSync(outputFixture('create-item-with-slots.output.yaml'), 'utf-8');
      expect(ctx.stdout).to.contain(expected.trim());
    });
});

function create(
  credentials: { vault_access_token: string; data_encryption_key: any },
  itemCreateData: NewItem
) {
  const testIdsToUse = ['a', 'b', 'c', 'd', 'e'].reverse();
  const testNamesToUse = ['Make', 'Model'];
  let slots: any[];

  if (itemCreateData.slots && itemCreateData.slots.length) {
    slots = itemCreateData.slots.map(slot => {
      return {
        name: slot['name'],
        encrypted_value: `[serialized][encrypted]${slot.value}[with my_generated_dek]`,
        encrypted: true,
        id: testIdsToUse.pop(),
      };
    });
  } else {
    slots = testNamesToUse.map(name => {
      return {
        id: testIdsToUse.pop(),
        name,
      };
    });
  }

  const slot_ids = slots.map(slot => slot.id);

  return Promise.resolve({
    associations_to: [],
    associations: [],
    classification_nodes: [],
    item: {
      id: 'item-foo',
      template_name: itemCreateData.template_name,
      label: itemCreateData.label,
      slot_ids,
    },
    slots,
  });
}

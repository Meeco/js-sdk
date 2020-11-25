import {
  ClassificationNode,
  NestedClassificationNodeAttributes,
  NestedSlotAttributes,
  PutItemsRequest,
} from '@meeco/vault-api-sdk';
import { IDEK } from '../services/service';
import SlotHelpers from '../util/slot-helpers';
import { toNestedClassificationNode } from '../util/transformers';
import ItemChange from './item-change';
import { NewItem } from './new-item';
import { NewSlot } from './slot-types';

/** Construct an update for an existing Item given its id. */
export class ItemUpdate extends ItemChange {
  public label?: string;

  static fromJSON(json: any) {
    return new ItemUpdate(json.id, json);
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      slots: this.slots,
      classification_nodes: this.classification_nodes,
    };
  }

  constructor(
    public readonly id: string,
    update: Partial<{
      label: string;
      classification_nodes: ClassificationNode[];
      slots: NewSlot[];
    }>
  ) {
    super(update.slots, update.classification_nodes);
    if (update.label === '') {
      throw new Error('Cannot create Item with empty label');
    }
    this.label = update.label;
  }

  public toNewItem(label: string, templateName: string): NewItem {
    return new NewItem(label, templateName, this.slots);
  }

  // for PUT /items/id
  // - should encrypt all values in slots attributes request
  public async toRequest(key: IDEK): Promise<PutItemsRequest> {
    if (SlotHelpers.findWithEncryptedValue(this.slots)) {
      throw new Error('Slot`s existing value will be overwritten');
    }

    // if (anyDuplicateSlotNames(this.slots)) {
    //   throw new Error('Duplicate Slot names will be merged');
    // }

    let slots_attributes: NestedSlotAttributes[] | undefined;
    if (this.slots.length > 0) {
      slots_attributes = await Promise.all(
        this.slots.map(slot => SlotHelpers.encryptSlot(key, slot))
      );
    }

    let classification_nodes_attributes: NestedClassificationNodeAttributes[] | undefined;
    if (this.classification_nodes.length > 0) {
      classification_nodes_attributes = this.classification_nodes.map(toNestedClassificationNode);
    }

    return {
      item: {
        classification_nodes_attributes,
        label: this.label,
        slots_attributes,
      },
    };
  }
}

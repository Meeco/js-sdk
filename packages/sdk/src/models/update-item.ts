import {
  ClassificationNode,
  NestedClassificationNodeAttributes,
  NestedSlotAttributes,
  PutItemsRequest,
} from '@meeco/vault-api-sdk';
import { ItemService } from '../services/item-service';
import { IDEK } from '../services/service';
import { toNestedClassificationNode } from '../util/transformers';
import { findWithEncryptedValue, NewSlot } from './local-slot';
import { NewItem } from './new-item';

/** Construct an update for an existing Item given its id. */
export class UpdateItem {
  constructor(
    public readonly id: string,
    public update: Partial<{
      label: string;
      classificationNodes: ClassificationNode[];
      slots: NewSlot[];
    }>
  ) {}

  get slots() {
    return this.update.slots || [];
  }

  // set slots(slots: NewSlot[]) {
  //   this.update.slots = slots;
  // }

  get label() {
    return this.update.label;
  }

  // set label(label: string | undefined) {
  //   this.update.label = label;
  // }

  /**
   * This just removes the Slot from the creation request. The Slot may still exist on the
   * created Item if it is a Template slot.
   */
  removeSlot(spec: { name?: string; label?: string }) {
    if (this.update.slots) {
      if (spec.name) {
        this.update.slots = this.update.slots.filter(s => s['name'] !== spec.name);
      }

      if (spec.label) {
        this.update.slots = this.update.slots.filter(s => s['label'] !== spec.label);
      }
    }
  }

  public toNewItem(label: string, templateName: string): NewItem {
    return new NewItem(label, templateName, this.slots);
  }

  // for PUT /items/id
  // - should encrypt all values in slots attributes request
  public async toRequest(key: IDEK): Promise<PutItemsRequest> {
    if (findWithEncryptedValue(this.slots)) {
      throw new Error('Slot`s existing value will be overwritten');
    }

    // if (anyDuplicateSlotNames(this.slots)) {
    //   throw new Error('Duplicate Slot names will be merged');
    // }

    let slots_attributes: NestedSlotAttributes[] | undefined;
    if (this.update?.slots) {
      slots_attributes = await Promise.all(
        this.slots.map(slot => ItemService.encryptSlot(key, slot))
      );
    }

    let classification_nodes_attributes: NestedClassificationNodeAttributes[] | undefined;
    if (this.update?.classificationNodes) {
      classification_nodes_attributes = this.update?.classificationNodes.map(
        toNestedClassificationNode
      );
    }

    return {
      item: {
        classification_nodes_attributes,
        label: this.update?.label,
        slots_attributes,
      },
    };
  }
}

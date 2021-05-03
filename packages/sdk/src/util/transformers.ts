import {
  ClassificationNode,
  NestedClassificationNodeAttributes,
  NestedSlotAttributes,
  Slot,
} from '@meeco/vault-api-sdk';
import { NewSlot, SlotType } from '../models/slot-types';

/** The API typically returns types with null props, but accepts only undefined */
function fix<T>(x: T | null): T | undefined {
  return x === null ? undefined : x;
}

export function toNestedClassificationNode(
  node: ClassificationNode
): NestedClassificationNodeAttributes {
  return Object.keys(node).reduce((acc, k) => {
    acc[k] = fix(node[k]);
    return acc;
  }, {});
}

export function toNestedSlot(
  slot: Slot,
  classificationNodes?: NestedClassificationNodeAttributes[]
): NestedSlotAttributes {
  const result = {
    ...slot,
    attachments_folder_id: fix(slot.attachments_folder_id),
    classification_node_attributes: classificationNodes,
    attachment_id: slot.attachment_id || undefined,
  };

  for (const k in result) {
    if (result[k] === null) {
      delete result[k];
    }
  }

  return result;
}

/**
 * Convert API returned Slots to NewSlot creation requests.
 * Renames image_id to image, and removes all props with null value.
 */
export function slotToNewSlot(slot: Slot): NewSlot {
  const result = {
    ...slot,
    slot_type_name: SlotType[slot.slot_type_name],
  };

  for (const k in result) {
    if (result[k] === null) {
      delete result[k];
    }
  }

  return result as NewSlot;
}

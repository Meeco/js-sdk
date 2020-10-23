import {
  ClassificationNode,
  NestedClassificationNodeAttributes,
  NestedSlotAttributes,
  Slot,
} from '@meeco/vault-api-sdk';

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
    image_id: slot.image ? slot.image : undefined,
    classification_node_attributes: classificationNodes,
  };

  for (const k in result) {
    if (result[k] === null) {
      delete result[k];
    }
  }

  return result;
}

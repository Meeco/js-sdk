import {
  ClassificationNode,
  ClassificationNodeAttributes,
  ItemTemplate,
  NestedSlotAttributes,
  PostItemsRequest,
  Slot,
} from '@meeco/vault-api-sdk';
import SlotHelpers from '../util/slot-helpers';
import { slotToNewSlot, toNestedClassificationNode } from '../util/transformers';
import ItemChange from './item-change';
import { NewSlot } from './slot-types';
import { SymmetricKey } from './symmetric-key';

/** An Item which does not exist in the API */
export class NewItem extends ItemChange {
  public static fromTemplate(
    template: ItemTemplate,
    templateSlots: Slot[],
    label: string,
    extraSlots: NewSlot[] = []
  ): NewItem {
    return new NewItem(label, template.name, templateSlots.map(slotToNewSlot).concat(extraSlots));
  }

  /**
   * Required fields for creating a new Item.
   * @param label Must be non-empty string
   * @param template_name Must be non-empty string
   */
  constructor(
    public readonly label: string,
    public template_name: string,
    public slots: NewSlot[] = [],
    public classification_nodes: Partial<ClassificationNode>[] = []
  ) {
    super(slots, classification_nodes);
    if (this.label === '') {
      throw new Error('Cannot create Item with empty label');
    }

    if (this.template_name === '') {
      throw new Error('Cannot create Item with empty template name');
    }
  }

  /**
   * constraints:
   * - each slot must have either a non-empty label or name
   * - slots may not have a 'value' field
   * - encrypted_value is either a cryppo formatted string or is not present
   * - slot type must be a valid type
   * @param dek
   */
  async toRequest(dek: SymmetricKey): Promise<PostItemsRequest> {
    const badValue = SlotHelpers.findWithEncryptedValue(this.slots);
    if (badValue) {
      throw new Error(
        `Slot ${
          badValue['name'] || badValue['label']
        } with existing encrypted_value with be overwritten`
      );
    }
    // TODO should enforce map integrity?

    let slots_attributes: NestedSlotAttributes[] = await Promise.all(
      this.slots.map(slot => SlotHelpers.encryptSlot({ data_encryption_key: dek }, slot))
    );

    // filter out any ids as this causes errors in POST /items endpoint
    slots_attributes.forEach(slot => {
      if ('id' in slot) {
        delete slot['id'];
      }
    });

    // filter out slots with encrypted_value: null
    slots_attributes = slots_attributes.filter(
      slot => slot.encrypted_value !== null && slot.encrypted_value !== undefined
    );

    let classification_nodes_attributes: ClassificationNodeAttributes[] | undefined = [];
    if (this.classification_nodes.length > 0) {
      classification_nodes_attributes = this.classification_nodes.map(toNestedClassificationNode);
    }

    return {
      template_name: this.template_name,
      item: {
        label: this.label,
        slots_attributes,
        classification_nodes_attributes,
      },
    };
  }
}

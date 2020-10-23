import { ItemTemplate, NestedSlotAttributes, PostItemsRequest, Slot } from '@meeco/vault-api-sdk';
import { ItemService } from '../services/item-service';
import { EncryptionKey } from './encryption-key';
import { findWithEncryptedValue, NewSlot, SlotType } from './local-slot';

function slotToNewSlot(s: Slot): NewSlot {
  const result = {
    ...s,
    slot_type_name: SlotType[s.slot_type_name],
    image_id: s.image ? s.image : undefined,
  };

  for (const k in result) {
    if (result[k] === null) {
      delete result[k];
    }
  }

  return result as NewSlot;
}

/** An Item which does not exist in the API */
export class NewItem {
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
   * @param templateName Must be non-empty string
   * @param slots
   */
  constructor(
    public readonly label: string,
    public templateName: string,
    public slots: NewSlot[] = []
  ) {
    if (this.label === '') {
      throw new Error('Cannot create Item with empty label');
    }

    if (this.templateName === '') {
      throw new Error('Cannot create Item with empty template name');
    }
  }

  /**
   * This just removes the Slot from the creation request. The Slot may still exist on the
   * created Item if it is a Template slot.
   */
  removeSlot(spec: { name?: string; label?: string }) {
    if (spec.name) {
      this.slots = this.slots.filter(s => s['name'] !== spec.name);
    }

    if (spec.label) {
      this.slots = this.slots.filter(s => s['label'] !== spec.label);
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
  async toRequest(dek: EncryptionKey): Promise<PostItemsRequest> {
    const badValue = findWithEncryptedValue(this.slots);
    if (badValue) {
      throw new Error(
        `Slot ${badValue['name'] ||
          badValue['label']} with existing encrypted_value with be overwritten`
      );
    }
    // TODO should enforce map integrity?

    const slots_attributes: NestedSlotAttributes[] = await Promise.all(
      this.slots.map(slot => ItemService.encryptSlot(slot, dek))
    );

    return {
      template_name: this.templateName,
      item: {
        label: this.label,
        slots_attributes,
      },
    };
  }
}

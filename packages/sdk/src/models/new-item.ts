import { ItemTemplate, NestedSlotAttributes, PostItemsRequest, Slot } from '@meeco/vault-api-sdk';
import { ItemService } from '../services/item-service';
import { slotToNewSlot } from '../util/transformers';
import { EncryptionKey } from './encryption-key';
import { findWithEncryptedValue, nameFromLabel, NewSlot } from './local-slot';

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
   * @param template_name Must be non-empty string
   */
  constructor(
    public readonly label: string,
    public template_name: string,
    public slots: NewSlot[] = [],
    public classification_nodes = []
  ) {
    if (this.label === '') {
      throw new Error('Cannot create Item with empty label');
    }

    if (this.template_name === '') {
      throw new Error('Cannot create Item with empty template name');
    }
  }

  /**
   * Set Slot values. Existing values in `this.slots` are overwritten if present in `assignment`.
   * `assignment` names that do not correspond to existing names in `this.slots` are created.
   * @param assignment A map from Slot.name to Slot.value.
   */
  assignSlots(assignment: Record<string, string>) {
    function getSlotName(slot: NewSlot): string {
      return slot.name || nameFromLabel(slot.label!);
    }

    const slotNameMap = this.slots.reduce((acc, slot) => {
      acc[getSlotName(slot)] = slot;
      return acc;
    }, {});

    Object.entries(assignment).forEach(([name, value]) => {
      if (name in slotNameMap) {
        slotNameMap[name].value = value
      } else {
        this.slots.push({ name, value });
      }
    });
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
      this.slots.map(slot => ItemService.encryptSlot({ data_encryption_key: dek }, slot))
    );

    return {
      template_name: this.template_name,
      item: {
        label: this.label,
        slots_attributes,
      },
    };
  }

}

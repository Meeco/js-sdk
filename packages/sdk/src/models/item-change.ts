import { ClassificationNode } from '@meeco/vault-api-sdk';
import ItemMap from './item-map';
import { NewSlot } from './local-slot';

/**
 * Represents a change to the Item that hasn't been posted to the API.
 * It can be modified, and contains only partial information about the Item.
 */
export default class ItemChange extends ItemMap<NewSlot> {
  constructor(
    public slots: NewSlot[] = [],
    public classification_nodes: ClassificationNode[] = []
  ) {
    super(slots);
  }

  /**
   * Existing values in `this.slots` are overwritten if present in `assignment`.
   * `assignment` names that do not correspond to existing names in `this.slots` are created.
   * @param assignment A map from Slot.name to Slot.value.
   */
  assignValues(assignment: Record<string, string | undefined>) {
    const slotNameMap: Record<string, NewSlot> = this.slotsByName;
    Object.entries(assignment).forEach(([name, value]) => {
      if (name in slotNameMap) {
        slotNameMap[name].value = value;
      } else {
        this.slots.push({ name, value });
      }
    });
  }

  /**
   * Set the Slot values in this change-set to *exactly* the given values.
   * Properties of existing Slots will be preserved.
   * Any Slots not in `assignment` will be removed from the change-set.
   */
  set values(assignment: Record<string, string | undefined>) {
    const slotNameMap: Record<string, NewSlot> = this.slotsByName;
    const newSlots: NewSlot[] = Object.entries(assignment).map(([name, value]) => {
      if (name in slotNameMap) {
        const existingSlot = slotNameMap[name];
        existingSlot.value = value;
        return existingSlot;
      } else {
        return { name, value };
      }
    });
    this.slots = newSlots;
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
}

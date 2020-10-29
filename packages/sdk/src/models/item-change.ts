import { ClassificationNode } from '@meeco/vault-api-sdk';
import cryppo from '../services/cryppo-service';
import { NewSlot, toNameSlotMap } from './local-slot';

/**
 * Represents a change to the Item that hasn't been posted to the API.
 * It can be modified, and contains only partial information about the Item.
 */
export class ItemChange {
  protected static readonly cryppo = (<any>global).cryppo || cryppo;

  constructor(
    public slots: NewSlot[] = [],
    public classification_nodes: ClassificationNode[] = []
  ) {}

  /**
   * Set Slot values. Existing values in `this.slots` are overwritten if present in `assignment`.
   * `assignment` names that do not correspond to existing names in `this.slots` are created.
   * @param assignment A map from Slot.name to Slot.value.
   */
  assignSlots(assignment: Record<string, string>) {
    const slotNameMap: Record<string, NewSlot> = toNameSlotMap(this);
    Object.entries(assignment).forEach(([name, value]) => {
      if (name in slotNameMap) {
        slotNameMap[name].value = value;
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
}

import { MinimalSlot, SlotHelpers } from './local-slot';

/**
 * This class adds the ability to represent an array of Slots (or Slot-like things) as
 * a map from names to Slots or values.
 * Where Slots are only given a label, then an appropriate name is computed.
 */
export default class ItemMap<SlotType extends MinimalSlot> {
  /**
   * Represent an Item or ItemChange as a map from Slot.names to Slots.
   * @param transform Optionally transform the values in the resulting map. By default returns the Slot itself.
   */
  static toNameSlotMap<S extends MinimalSlot, T>(
    slots: S[],
    transform?: (_: S) => T
  ): Record<string, S | T> {
    function getSlotName(slot: S): string {
      return slot.name || SlotHelpers.nameFromLabel(slot.label!);
    }

    const map = {};

    slots.forEach(slot => {
      map[getSlotName(slot)] = transform ? transform(slot) : slot;
    });

    return map;
  }

  constructor(public readonly slots: SlotType[]) {}

  /**
   * The Slots in this ItemMap keyed by their names.
   */
  get slotsByName(): Record<string, SlotType> {
    return ItemMap.toNameSlotMap(this.slots);
  }

  /**
   * The values of Slots in this ItemMap keyed by names.
   */
  get values(): Record<string, string | undefined> {
    return ItemMap.toNameSlotMap(this.slots, slot => slot['value']);
  }
}

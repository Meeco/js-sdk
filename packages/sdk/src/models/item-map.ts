import { MinimalSlot, SlotHelpers } from './local-slot';

/**
 * Index an array of Slot-like objects by their name (or label if name is missing).
 * @param transform Optionally transform the values in the resulting map. By default returns the Slot itself.
 */
export function indexSlotsByName<S extends MinimalSlot, T>(
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

/**
 * This class adds the ability to represent an array of Slots (or Slot-like things) as
 * a map from names to Slots or values.
 * Where Slots are only given a label, then an appropriate name is computed.
 */
export default class ItemMap<SlotType extends MinimalSlot> {
  constructor(public readonly slots: SlotType[]) {}

  /**
   * The Slots in this ItemMap keyed by their names.
   */
  get slotsByName(): Record<string, SlotType> {
    return indexSlotsByName(this.slots);
  }

  /**
   * The values of Slots in this ItemMap keyed by names.
   */
  get values(): Record<string, string | undefined> {
    return indexSlotsByName(this.slots, slot => slot['value']);
  }
}

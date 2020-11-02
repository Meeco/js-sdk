import { MinimalSlot, SlotHelpers } from './local-slot';

/**
 * This class adds `toMap` which is a specialization of `toNameSlotMap` for the particular type of
 * Slot that the Item contains.
 */
export default class ItemMap<SlotType extends MinimalSlot> {
  /**
   * Represent an Item as a map from Slot.names to Slots.
   * @param item
   */
  static toNameSlotMap<S extends MinimalSlot>(slots: S[]): Record<string, S> {
    function getSlotName(slot: S): string {
      return slot.name || SlotHelpers.nameFromLabel(slot.label!);
    }

    const map: Record<string, S> = {};

    slots.forEach(slot => {
      map[getSlotName(slot)] = slot;
    });

    return map;
  }

  constructor(public readonly slots: SlotType[]) {}

  /**
   * The Item represented as a map from Slot names to Slots.
   */
  toMap(): Record<string, SlotType> {
    return ItemMap.toNameSlotMap(this.slots);
  }
}

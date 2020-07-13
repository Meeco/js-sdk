import { NestedSlotAttributes } from '@meeco/vault-api-sdk';

export interface IItemRequestData {
  label: string;
}
export type ItemSlot = Omit<NestedSlotAttributes, 'encrypted_value'>;

export class ItemCreateData {
  public template_name?: string;
  public item: IItemRequestData;
  public slots?: ItemSlot[]; // needs to be partials.

  constructor(config: { template_name?: string; slots?: ItemSlot[]; item: IItemRequestData }) {
    this.template_name = config.template_name;
    this.item = config.item;
    this.slots = config.slots || [];
  }
}

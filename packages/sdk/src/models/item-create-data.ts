import { DecryptedSlot } from './local-slot';

export interface IItemRequestData {
  label: string;
}

export class ItemCreateData {
  public template_name?: string;
  public item: IItemRequestData;
  public slots?: DecryptedSlot[]; // needs to be partials.

  constructor(config: { template_name?: string; slots?: DecryptedSlot[]; item: IItemRequestData }) {
    this.template_name = config.template_name;
    this.item = config.item;
    this.slots = config.slots || [];
  }
}

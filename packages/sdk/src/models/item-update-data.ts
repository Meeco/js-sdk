import { Slot } from '@meeco/vault-api-sdk';

export class ItemUpdateData {
  public id: string;
  public label: string;
  public slots?: Slot[];

  constructor(config: { id: string; slots?: Slot[]; label: string }) {
    this.id = config.id;
    this.label = config.label;
    this.slots = config.slots || [];
  }
}

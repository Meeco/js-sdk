import { DecryptedSlot } from './local-slot';

export class ItemUpdateData {
  public id: string;
  public label: string;
  public slots?: DecryptedSlot[];

  constructor(config: { id: string; slots?: DecryptedSlot[]; label: string }) {
    this.id = config.id;
    this.label = config.label;
    this.slots = config.slots || [];
  }
}

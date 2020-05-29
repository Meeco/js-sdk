import { Slot } from '@meeco/vault-api-sdk';

export class ItemCreateData {
  label: string;
  templateName: string;
  slots?: Slot[];

  constructor(data: { label: string; templateName: string; slots?: Slot[] }) {
    this.label = data.label;
    this.templateName = data.templateName;
    this.slots = data.slots;
  }
}

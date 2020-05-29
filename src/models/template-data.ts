import { ItemTemplateWithoutAssociations, Slot } from '@meeco/vault-api-sdk';

export class TemplateData {
  public template: ItemTemplateWithoutAssociations;
  public slots: Slot[];

  constructor(data: { template: ItemTemplateWithoutAssociations; slots?: Slot[] }) {
    this.template = data.template;
    this.slots = data.slots || [];
  }

  toJSON() {
    return {
      ...this.template,
      slots: this.slots
    };
  }
}

import { ClassificationNode, ItemTemplateWithoutAssociations, Slot } from '@meeco/vault-api-sdk';

export interface ITemplateData {
  template: Partial<ItemTemplateWithoutAssociations> & Required<{ label: string }>;
  slots: Slot[];
  classification_nodes?: ClassificationNode[];
}

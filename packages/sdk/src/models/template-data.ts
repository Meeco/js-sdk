import { ClassificationNode, ItemTemplate, Slot } from '@meeco/vault-api-sdk';

export interface ITemplateData {
  template: Partial<ItemTemplate> & Required<{ label: string }>;
  slots: Slot[];
  classification_nodes?: ClassificationNode[];
}

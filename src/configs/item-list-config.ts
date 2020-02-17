import { Item, Slot } from '@meeco/meeco-api-sdk';
import { ItemConfig } from './item-config';

interface IItemTemplate {
  items: ItemConfig[];
}

interface IItemMetadata {
  template: string;
}

export class ItemListConfig {
  static kind = 'Items';

  constructor(public readonly templateName: string, public readonly itemList: IItemTemplate) {}

  static encodeFromJson(json: { items?: Item[]; slots?: Slot[] }, metadata?: IItemMetadata) {
    return {
      kind: ItemListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json.items
    };
  }
}

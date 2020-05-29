import { ItemData } from '../models/item-data';
import { ItemConfig } from './item-config';

export interface IItemListTemplate {
  items: ItemConfig[];
}

export interface IItemListMetadata {
  template: string;
}

export class ItemListConfig {
  static kind = 'Items';

  constructor(public readonly templateName: string, public readonly itemList: IItemListTemplate) {}

  static encodeFromItemData(data: { items: ItemData[] }, metadata?: IItemListMetadata) {
    return {
      kind: ItemListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: data.items
    };
  }
}

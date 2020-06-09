import { ItemsResponse } from '@meeco/vault-api-sdk';
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

  static encodeFromJSON(json: ItemsResponse, metadata?: IItemListMetadata) {
    return {
      kind: ItemListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json.items
    };
  }
}

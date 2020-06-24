import { PostFastItemsRequestItem, Slot } from '@meeco/vault-api-sdk';

export type IItemRequestData = Partial<PostFastItemsRequestItem> & Required<{ label: string }>;

export class ItemCreateData {
  public template?: string;
  public item: IItemRequestData;
  public slots?: Slot[];

  constructor(config: { template?: string; slots?: Slot[]; item: IItemRequestData }) {
    this.template = config.template;
    this.item = config.item;
    this.slots = config.slots || [];
  }
}

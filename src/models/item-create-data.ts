import { PostFastItemsRequestItem, Slot } from '@meeco/vault-api-sdk';

export type IItemRequestData = Partial<PostFastItemsRequestItem> & Required<{ label: string }>;

export class ItemCreateData {
  public templateName: string;
  public item: IItemRequestData;
  public slots?: Slot[];

  constructor(config: { templateName: string; slots?: Slot[]; item: IItemRequestData }) {
    this.templateName = config.templateName;
    this.item = config.item;
    this.slots = config.slots || [];
  }
}

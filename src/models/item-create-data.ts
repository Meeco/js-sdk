import { PostFastItemsRequestItem, Slot } from '@meeco/vault-api-sdk';

export type IItemRequestData = Partial<PostFastItemsRequestItem> & Required<{ label: string }>;

export class ItemCreateData {
  public templateName: string;
  public item: IItemRequestData;
  public slots?: Slot[];

  constructor(data: { templateName: string; slots?: Slot[]; item: IItemRequestData }) {
    this.templateName = data.templateName;
    this.item = data.item;
    this.slots = data.slots;
  }
}

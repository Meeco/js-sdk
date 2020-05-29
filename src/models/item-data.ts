import { Attachment, Item, Slot, Thumbnail } from '@meeco/vault-api-sdk';

export interface IItemMetadata {
  template: string;
  shareId?: string;
}

export class ItemData {
  public item: Item;
  public slots?: Slot[];
  public thumbnails?: Thumbnail[];
  public attachments?: Attachment[];
  public metadata?: IItemMetadata;

  constructor(data: {
    item: Item;
    slots?: Slot[];
    thumbnails?: Thumbnail[];
    attachments?: Attachment[];
    metadata?: IItemMetadata;
  }) {
    this.item = data.item;
    this.slots = data.slots;
    this.thumbnails = data.thumbnails;
    this.attachments = data.attachments;
    this.metadata = data.metadata;
  }

  toJSON() {
    const nested = ['slots', 'thumbnails', 'attachments'].reduce((res, key) => {
      if (this[key]) {
        res[key] = this[key];
      }

      return res;
    }, {});

    return {
      ...this.item,
      ...nested
    };
  }
}

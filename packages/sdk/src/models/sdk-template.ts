import {
  Attachment,
  ClassificationNode,
  ItemTemplate,
  ItemTemplateResponse,
  Slot,
  Thumbnail,
} from '@meeco/vault-api-sdk';
import { slotToNewSlot } from '../util/transformers';
import ItemMap from './item-map';
import { NewItem } from './new-item';

/**
 * Local copy of an API ItemTemplate.
 * View slots as a map with `template.slotsByName` or create a new Item with `toNewItem()`
 */
export class SDKTemplate extends ItemMap<Slot> {
  public readonly id: string;
  public readonly name: string;
  public readonly label: string;
  public readonly description: string;

  public readonly thumbnails: Thumbnail[];
  public readonly attachments: Attachment[];

  public readonly classification_nodes: ClassificationNode[];

  /** These include the slot's classifications */
  private allClassificationNodes: ClassificationNode[];

  static fromAPI(response: ItemTemplateResponse) {
    const { classification_nodes, slots, item_template, attachments, thumbnails } = response;
    return new SDKTemplate(item_template, slots, { classification_nodes, attachments, thumbnails });
  }

  constructor(
    public readonly itemTemplate: ItemTemplate,
    slots: Slot[],
    extra: Partial<{
      classification_nodes: ClassificationNode[];
      attachments: Attachment[];
      thumbnails: Thumbnail[];
    }> = {}
  ) {
    super(slots.filter(s => itemTemplate.slot_ids.some(id => id === s.id)));

    // simpler interface
    this.id = itemTemplate.id;
    this.name = itemTemplate.name;
    this.label = itemTemplate.label;
    this.description = itemTemplate.description;

    this.allClassificationNodes = extra.classification_nodes || [];
    this.classification_nodes =
      this.allClassificationNodes.filter(x =>
        itemTemplate.classification_node_ids.some(y => y === x.id)
      ) || [];
    this.attachments = extra.attachments || [];
    this.thumbnails = extra.thumbnails || [];
  }

  toNewItem(label: string): NewItem {
    return new NewItem(label, this.name, this.slots.map(slotToNewSlot));
  }
}

import { DecryptedSlot, ITemplateData } from '@meeco/sdk';
import { Attachment, Item, /*Share, */Slot, Thumbnail } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ITEM_ASSOCIATIONS, SLOT_TYPE_BLACKLIST } from '../util/constants';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IItemTemplate {
  id?: string;
  label: string;
  slots: Slot[];
}

export interface IItemMetadata {
  template_name: string;
  shareId?: string;
}

@ConfigReader<ItemConfig>()
export class ItemConfig {
  static kind = 'Item';

  constructor(public readonly templateName?: string, public readonly itemConfig?: IItemTemplate) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IItemMetadata, IItemTemplate>): ItemConfig {
    if (yamlConfigObj.kind !== ItemConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${ItemConfig.kind}')`
      );
    }
    if ((<any>yamlConfigObj.metadata)?.template) {
      throw new CLIError(
        `Metadata value 'template' in item config is no longer supported - please use 'template_name' instead.')`
      );
    }
    return new ItemConfig(yamlConfigObj.metadata?.template_name, yamlConfigObj.spec);
  }

  static encodeFromJSON(data: {
    item: Item;
    slots?: DecryptedSlot[];
    thumbnails?: Thumbnail[];
    attachments?: Attachment[];
    // shares?: Share[];
    metadata?: IItemMetadata;
  }) {
    const nested = ITEM_ASSOCIATIONS.reduce((res, key) => {
      if (data[key]) {
        res[key] = data[key];
      }
      return res;
    }, {});

    return {
      kind: ItemConfig.kind,
      ...(data.metadata ? { metadata: data.metadata } : {}),
      spec: {
        ...data.item,
        ...nested
      }
    };
  }

  static encodeFromTemplate(template: ITemplateData) {
    // There are a bunch of boilerplate slots that the server returns - we filter them out for cleanliness
    const notBlacklisted = (slot: Slot) => !SLOT_TYPE_BLACKLIST.includes(slot.slot_type_name);

    return {
      kind: ItemConfig.kind,
      metadata: {
        template_name: template.template.name
      },
      spec: {
        label: '',
        slots: template.slots.filter(notBlacklisted).map(slot => ({
          name: slot.name,
          value: ''
        }))
      }
    };
  }
}

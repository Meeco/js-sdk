import { DecryptedSlot, ITemplateData } from '@meeco/sdk';
import { Attachment, Item, Slot, Thumbnail } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ITEM_ASSOCIATIONS, SLOT_TYPE_BLACKLIST } from '../util/constants';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IItemTemplate {
  label: string;
  slots: Slot[];
}

export interface IItemMetadata {
  template: string;
  shareId?: string;
}

@ConfigReader<ItemConfig>()
export class ItemConfig {
  static kind = 'Item';

  constructor(public readonly templateName: string, public readonly itemConfig: IItemTemplate) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IItemMetadata, IItemTemplate>): ItemConfig {
    if (yamlConfigObj.kind !== ItemConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${ItemConfig.kind}')`
      );
    }
    return new ItemConfig(yamlConfigObj.metadata.template, yamlConfigObj.spec);
  }

  static encodeFromJSON(data: {
    item: Item;
    slots?: DecryptedSlot[];
    thumbnails?: Thumbnail[];
    attachments?: Attachment[];
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
    const notBlacklisted = (slot: Slot) => !SLOT_TYPE_BLACKLIST.includes(slot.slot_type_name);

    return {
      kind: ItemConfig.kind,
      metadata: {
        template: template.template.name
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

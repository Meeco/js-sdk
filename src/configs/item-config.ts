import { Slot } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ItemCreateData } from '../models/item-create-data';
import { IItemMetadata, ItemData } from '../models/item-data';
import { TemplateData } from '../models/template-data';
import { SLOT_TYPE_BLACKLIST } from '../util/constants';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IItemTemplate {
  label: string;
  slots: Slot[];
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

  static encodeFromItemData(data: ItemData) {
    return {
      kind: ItemConfig.kind,
      ...(data.metadata ? { metadata: data.metadata } : {}),
      spec: data
    };
  }

  static encodeFromTemplate(data: TemplateData) {
    const notBlacklisted = (slot: Slot) => !SLOT_TYPE_BLACKLIST.includes(slot.slot_type_name);

    return ItemConfig.encodeFromItemData(
      new ItemData({
        item: {
          label: ''
        } as any,
        slots: data.slots.filter(notBlacklisted).map(slot => ({
          name: slot.name,
          value: ''
        })) as any,
        metadata: {
          template: data.template.name
        }
      })
    );
  }

  public toItemCreateData(): ItemCreateData {
    return new ItemCreateData({
      label: this.itemConfig.label,
      templateName: this.templateName,
      slots: this.itemConfig.slots
    });
  }
}

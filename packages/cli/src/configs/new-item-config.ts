import { DecryptedItem, ITemplateData } from '@meeco/sdk';
import { Slot } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { SLOT_TYPE_BLACKLIST } from '../util/constants';
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

@ConfigReader<NewItemConfig>()
export class NewItemConfig {
  static kind = 'Item';

  /** Template Name is mandatory when creating an Item */
  constructor(public readonly templateName: string, public readonly itemConfig?: IItemTemplate) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IItemMetadata, IItemTemplate>): NewItemConfig {
    if (yamlConfigObj.kind !== NewItemConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${NewItemConfig.kind}')`
      );
    }
    if ((<any>yamlConfigObj.metadata)?.template) {
      throw new CLIError(
        `Metadata value 'template' in item config is no longer supported - please use 'template_name' instead.')`
      );
    }
    if (!(<any>yamlConfigObj.metadata)?.template_name) {
      throw new CLIError(`Metadata value 'template_name' is required)`);
    }

    return new NewItemConfig(yamlConfigObj.metadata!.template_name, yamlConfigObj.spec);
  }

  // Print the response after creating an object
  // TODO this should be its own file, it is identical with ItemUpdateConfig
  static encodeFromJSON(data: DecryptedItem) {
    const { item, slots, classification_nodes } = data;
    return {
      kind: NewItemConfig.kind,
      spec: {
        ...item,
        slots,
        classification_nodes,
      },
    };
  }

  static encodeFromTemplate(template: ITemplateData) {
    // There are a bunch of boilerplate slots that the server returns - we filter them out for cleanliness
    const notBlacklisted = (slot: Slot) => !SLOT_TYPE_BLACKLIST.includes(slot.slot_type_name);

    return {
      kind: NewItemConfig.kind,
      metadata: {
        template_name: template.template.name,
      },
      spec: {
        label: '',
        slots: template.slots.filter(notBlacklisted).map(slot => ({
          name: slot.name,
          value: '',
        })),
      },
    };
  }
}

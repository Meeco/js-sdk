import { DecryptedItem } from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { IItemTemplate, ItemNewConfig } from './item-new-config';
import { ConfigReader, IYamlConfig } from './yaml-config';

@ConfigReader<ItemUpdateConfig>()
export class ItemUpdateConfig {
  static kind = 'Item';

  /** You can only update an Item's label, Slots, Classifications, Attachments or Associations. */
  constructor(public readonly itemConfig?: IItemTemplate) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig<{}, IItemTemplate>): ItemUpdateConfig {
    if (yamlConfigObj.kind !== ItemUpdateConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${ItemUpdateConfig.kind}')`
      );
    }

    return new ItemUpdateConfig(yamlConfigObj.spec);
  }

  static encodeFromJSON(data: DecryptedItem) {
    return ItemNewConfig.encodeFromJSON(data);
  }
}

import { EncryptionKey } from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from './auth-config';
import { IYamlConfig } from './yaml-config';

interface IShareSpec {
  item_id: string;
  slot_id?: string;
  connection_id: string;
  from: AuthConfig;
}

export class ShareConfig {
  static kind = 'Share';

  public readonly connectionId: string;
  public readonly from: AuthConfig;
  public readonly itemId: string;
  public readonly slotId?: string;
  public readonly options: {};

  constructor(data: ShareConfig) {
    this.itemId = data.itemId;
    this.from = data.from;
    this.connectionId = data.connectionId;
    this.options = data.options;
    this.slotId = data.slotId;
  }

  static fromYamlConfig(yamlConfigObj: IYamlConfig<{}, IShareSpec>): ShareConfig {
    if (yamlConfigObj.kind !== ShareConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${ShareConfig.kind}')`
      );
    }

    return new ShareConfig({
      from: AuthConfig.fromMetadata(yamlConfigObj.spec.from),
      connectionId: yamlConfigObj.spec.connection_id,
      itemId: yamlConfigObj.spec.item_id,
      options: yamlConfigObj.metadata!,
      slotId: yamlConfigObj.spec.slot_id
    });
  }

  static encodeFromJson(payload: { connectionId: string; sharedDataEncryptionKey: string }) {
    return {
      kind: ShareConfig.kind,
      metadata: {
        connection_id: payload.connectionId,
        shared_data_encryption_key: EncryptionKey.fromRaw(payload.sharedDataEncryptionKey),
      },
      spec: {},
    };
  }

  static encodeFromUsersWithItem(
    from: AuthConfig,
    connectionId: string,
    itemId: string,
    slotId: string | undefined
  ): IYamlConfig<any, IShareSpec> {
    return {
      kind: ShareConfig.kind,
      metadata: {},
      spec: {
        item_id: itemId,
        ...(slotId ? {slot_id: slotId} : {}),
        connection_id: connectionId,
        from,
      },
    };
  }
}

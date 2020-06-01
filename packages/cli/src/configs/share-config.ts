import { EncryptionKey } from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from './auth-config';
import { IYamlConfig } from './yaml-config';

interface IShareSpec {
  item_id: string;
  to: AuthConfig;
  from: AuthConfig;
}

export class ShareConfig {
  static kind = 'Share';

  public readonly to: AuthConfig;
  public readonly from: AuthConfig;
  public readonly itemId: string;
  public readonly options: {};

  constructor(data: ShareConfig) {
    this.itemId = data.itemId;
    this.from = data.from;
    this.to = data.to;
    this.options = data.options;
  }

  static fromYamlConfig(yamlConfigObj: IYamlConfig<{}, IShareSpec>): ShareConfig {
    if (yamlConfigObj.kind !== ShareConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${ShareConfig.kind}')`
      );
    }

    return new ShareConfig({
      from: AuthConfig.fromMetadata(yamlConfigObj.spec.from),
      to: AuthConfig.fromMetadata(yamlConfigObj.spec.to),
      itemId: yamlConfigObj.spec.item_id,
      options: yamlConfigObj.metadata
    });
  }

  static encodeFromJson(payload: { connectionId: string; sharedDataEncryptionKey: string }) {
    return {
      kind: ShareConfig.kind,
      metadata: {
        connection_id: payload.connectionId,
        shared_data_encryption_key: EncryptionKey.fromRaw(payload.sharedDataEncryptionKey)
      },
      spec: {}
    };
  }

  static encodeFromUsersWithItem(
    from: AuthConfig,
    to: AuthConfig,
    itemId: string
  ): IYamlConfig<any, IShareSpec> {
    return {
      kind: ShareConfig.kind,
      metadata: {},
      spec: {
        item_id: itemId,
        from,
        to
      }
    };
  }
}

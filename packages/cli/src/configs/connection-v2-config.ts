import { Connection } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IConnectionMetadata {}

export interface IConnectionTemplate extends Connection {}

@ConfigReader<ConnectionV2Config>()
export class ConnectionV2Config {
  static kind = 'Connection';

  constructor(
    public readonly connection: IConnectionTemplate,
    public readonly metadata?: IConnectionMetadata
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IConnectionMetadata, IConnectionTemplate>
  ): ConnectionV2Config {
    if (yamlConfigObj.kind !== ConnectionV2Config.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${ConnectionV2Config.kind}')`
      );
    }

    return new ConnectionV2Config(yamlConfigObj.spec, yamlConfigObj.metadata);
  }

  static encodeFromJSON(json: Connection, metadata?: {}) {
    return {
      kind: ConnectionV2Config.kind,
      ...(metadata ? { metadata } : {}),
      spec: json,
    };
  }
}

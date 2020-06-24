import { PutTasksRequest } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IClientTasksMetadata {
  template: string;
}

@ConfigReader<ClientTasksConfig>()
export class ClientTasksConfig {
  static kind = 'ClientTaskQueue';

  constructor(
    public readonly templateName?: string,
    public readonly clientTasksConfig?: PutTasksRequest
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IClientTasksMetadata, PutTasksRequest>
  ): ClientTasksConfig {
    if (yamlConfigObj.kind !== ClientTasksConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${ClientTasksConfig.kind}')`
      );
    }
    return new ClientTasksConfig(yamlConfigObj.metadata?.template, yamlConfigObj.spec);
  }
}

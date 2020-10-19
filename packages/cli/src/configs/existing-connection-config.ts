import { IConnectionMetadata } from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { IYamlConfig } from './yaml-config';

interface IExistingConnectionSpec {
  invitation_id: string;
  from_user_connection_id: string;
  to_user_connection_id: string;
}

export class ExistingConnectionConfig {
  static kind = 'Connection';

  public readonly invitation_id: string;
  public readonly from_user_connection_id: string;
  public readonly to_user_connection_id: string;

  public readonly options: IConnectionMetadata;

  constructor(data: { spec: IExistingConnectionSpec; options: IConnectionMetadata }) {
    this.invitation_id = data.spec.invitation_id;
    this.from_user_connection_id = data.spec.from_user_connection_id;
    this.to_user_connection_id = data.spec.to_user_connection_id;
    this.options = data.options;
  }

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IConnectionMetadata, IExistingConnectionSpec>
  ): ExistingConnectionConfig {
    if (yamlConfigObj.kind !== ExistingConnectionConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${ExistingConnectionConfig.kind}')`
      );
    }

    return new ExistingConnectionConfig({
      spec: yamlConfigObj.spec!,
      options: yamlConfigObj.metadata!,
    });
  }
}

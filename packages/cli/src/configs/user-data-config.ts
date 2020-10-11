import { MeResponse, PutMeRequestUser } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IUserDataTemplate extends PutMeRequestUser {
  id?: string;
}

@ConfigReader<UserDataConfig>()
export class UserDataConfig {
  static kind = 'UserData';

  constructor(public readonly userConfig: IUserDataTemplate) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IUserDataTemplate>): UserDataConfig {
    if (yamlConfigObj.kind !== UserDataConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${UserDataConfig.kind}')`
      );
    }

    return new UserDataConfig(yamlConfigObj.spec);
  }

  static encodeFromJSON(json: MeResponse) {
    const { id, private_dek_external_id, user_type } = json.user;

    return {
      kind: UserDataConfig.kind,
      spec: {
        id,
        private_dek_external_id,
        user_type,
      },
    };
  }
}

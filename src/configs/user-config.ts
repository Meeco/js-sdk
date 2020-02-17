import { ConfigReader, IYamlConfig } from './yaml-config';

@ConfigReader<UserConfig>()
export class UserConfig {
  constructor(public readonly password: string, public readonly secret: string) {}

  static fromYamlConfig(yamlConfigObj: IYamlConfig) {
    if (yamlConfigObj.kind !== 'User') {
      throw new Error(`Config file of incorrect kind: ${yamlConfigObj.kind} (expected 'User')`);
    }
    return new UserConfig(yamlConfigObj.spec.password, yamlConfigObj.spec.secret);
  }
}

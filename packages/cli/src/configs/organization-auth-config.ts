import { OrganizationAuthData } from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { IYamlConfig } from './yaml-config';

interface IOrganizationAuthMetadata {
  vault_access_token: string;
}

export class OrganizationAuthConfig {
  static kind = 'Authentication';
  public readonly vault_access_token: string;

  constructor(data: { vault_access_token: string }) {
    this.vault_access_token = data.vault_access_token;
  }

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IOrganizationAuthMetadata>
  ): OrganizationAuthConfig {
    if (yamlConfigObj.kind !== OrganizationAuthConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${OrganizationAuthConfig.kind}')`
      );
    }
    let clonedConfig = { ...yamlConfigObj.metadata };
    delete clonedConfig.vault_access_token;
    if (Object.keys(clonedConfig).length > 0) {
      throw new CLIError(
        `Config file contains additional properties and may not be an OrganizationAuthConfig (could be a user's Auth config). The only property that should be present in an OrganizationAuthConfig is vault_access_token`
      );
    }
    return new OrganizationAuthConfig({
      ...yamlConfigObj.metadata!,
    });
  }

  static fromMetadata(metadata: IOrganizationAuthMetadata) {
    return OrganizationAuthConfig.fromYamlConfig({
      kind: OrganizationAuthConfig.kind,
      metadata,
      spec: {},
    });
  }

  static encodeFromAuthData(payload: OrganizationAuthData): IYamlConfig<IOrganizationAuthMetadata> {
    const payloadSortedAlphabetically: OrganizationAuthData = Object.keys(payload)
      .sort()
      .reduce((prev, key) => ({ ...prev, [key]: payload[key] }), {} as any);
    return {
      kind: OrganizationAuthConfig.kind,
      metadata: payloadSortedAlphabetically, // Note: SymmetricKey's should stringify with their own `toJSON()`
      spec: {},
    };
  }

  /**
   * Create a new AuthData instance from a serialized version
   */
  static fromJSON(json: any) {
    return new OrganizationAuthData({
      vault_access_token: json.vault_access_token,
    });
  }

  /**
   * Allow AuthData to be serialized for easier storage
   */
  toJSON() {
    return {
      vault_access_token: this.vault_access_token,
    };
  }
}

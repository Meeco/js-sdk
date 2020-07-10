import { Organization, PostOrganizationRequest } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IOrganizationMetadata {
  privateKey: string;
  publicKey: string;
}

export interface IOrganizationTemplate extends PostOrganizationRequest {
  id?: string;
}

@ConfigReader<OrganizationConfig>()
export class OrganizationConfig {
  static kind = 'Organization';

  constructor(
    public readonly organization: IOrganizationTemplate,
    public readonly metadata?: IOrganizationMetadata
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IOrganizationMetadata, IOrganizationTemplate>
  ): OrganizationConfig {
    if (yamlConfigObj.kind !== OrganizationConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${OrganizationConfig.kind}')`
      );
    }

    return new OrganizationConfig(yamlConfigObj.spec, yamlConfigObj.metadata);
  }

  static encodeFromJSON(json: Organization, metadata?: {}) {
    return {
      kind: OrganizationConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json
    };
  }
}

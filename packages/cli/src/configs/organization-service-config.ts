import { PostServiceRequest, Service } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IOrganizationServiceMetadata {
  privateKey: string;
  publicKey: string;
}

export interface IOrganizationServiceTemplate extends PostServiceRequest {
  id?: string;
  organization_id?: string;
}

@ConfigReader<OrganizationServiceConfig>()
export class OrganizationServiceConfig {
  static kind = 'OrganizationService';

  constructor(
    public readonly service: IOrganizationServiceTemplate,
    public readonly metadata?: IOrganizationServiceMetadata
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IOrganizationServiceMetadata, IOrganizationServiceTemplate>
  ): OrganizationServiceConfig {
    if (yamlConfigObj.kind !== OrganizationServiceConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${OrganizationServiceConfig.kind}')`
      );
    }

    return new OrganizationServiceConfig(yamlConfigObj.spec, yamlConfigObj.metadata);
  }

  static encodeFromJSON(json: Service, metadata?: {}) {
    return {
      kind: OrganizationServiceConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json,
    };
  }
}

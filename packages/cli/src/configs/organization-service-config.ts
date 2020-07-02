import { PostServiceRequest, Service } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IOrganizationServiceMetadata {}

export interface IOrganizationServiceTemplate extends PostServiceRequest {
  id?: string;
}

@ConfigReader<OrganizationServiceConfig>()
export class OrganizationServiceConfig {
  static kind = 'OrganizationService';

  constructor(public readonly service: IOrganizationServiceTemplate) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IOrganizationServiceMetadata, IOrganizationServiceTemplate>
  ): OrganizationServiceConfig {
    if (yamlConfigObj.kind !== OrganizationServiceConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${OrganizationServiceConfig.kind}')`
      );
    }

    return new OrganizationServiceConfig(yamlConfigObj.spec);
  }

  static encodeFromJSON(json: Service) {
    return {
      kind: OrganizationServiceConfig.kind,
      spec: json
    };
  }
}

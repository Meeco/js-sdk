import { OrganizationMember } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IOrganizationMemberMetadata {}

export interface IOrganizationMemberTemplate extends OrganizationMember {
  organization_id?: string;
}

@ConfigReader<OrganizationMemberConfig>()
export class OrganizationMemberConfig {
  static kind = 'OrganizationMember';

  constructor(
    public readonly member: IOrganizationMemberTemplate,
    public readonly metadata?: IOrganizationMemberMetadata
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IOrganizationMemberMetadata, IOrganizationMemberTemplate>
  ): OrganizationMemberConfig {
    if (yamlConfigObj.kind !== OrganizationMemberConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${OrganizationMemberConfig.kind}')`
      );
    }

    return new OrganizationMemberConfig(yamlConfigObj.spec, yamlConfigObj.metadata);
  }
}

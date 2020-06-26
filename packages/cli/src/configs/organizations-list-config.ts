import { Organization } from '@meeco/vault-api-sdk';
import { OrganizationConfig } from './organization-config';

export interface IOrganizationsListTemplate {
  organizations: OrganizationConfig[];
}

export interface IOrganizationsListMetadata {
  template: string;
}

export class OrganizationsListConfig {
  static kind = 'Organizations';

  constructor(
    public readonly templateName: string,
    public readonly itemList: IOrganizationsListTemplate
  ) {}

  static encodeFromJSON(json: Organization[], metadata?: IOrganizationsListMetadata) {
    return {
      kind: OrganizationsListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json
    };
  }
}

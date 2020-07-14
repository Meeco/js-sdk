import { Service } from '@meeco/vault-api-sdk';
import { OrganizationServiceConfig } from './organization-service-config';

export interface IOrganizationServiceListTemplate {
  services: OrganizationServiceConfig[];
}

export interface IOrganizationServiceListMetadata {
  template_name: string;
}

export class OrganizationServiceListConfig {
  static kind = 'OrganizationServices';

  constructor(
    public readonly templateName: string,
    public readonly itemList: IOrganizationServiceListTemplate
  ) {}

  static encodeFromJSON(json: Service[], metadata?: IOrganizationServiceListMetadata) {
    return {
      kind: OrganizationServiceListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json
    };
  }
}

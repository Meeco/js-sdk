import { Invitation } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IInvitationMetadata {}

export interface IInvitationTemplate extends Invitation {}

@ConfigReader<InvitationConfig>()
export class InvitationConfig {
  static kind = 'Invitation';

  constructor(
    public readonly invitation: IInvitationTemplate,
    public readonly metadata?: IInvitationMetadata
  ) {}

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IInvitationMetadata, IInvitationTemplate>
  ): InvitationConfig {
    if (yamlConfigObj.kind !== InvitationConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: '${yamlConfigObj.kind}' (expected '${InvitationConfig.kind}')`
      );
    }

    return new InvitationConfig(yamlConfigObj.spec, yamlConfigObj.metadata);
  }

  static encodeFromJSON(json: Invitation, metadata?: {}) {
    return {
      kind: InvitationConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json,
    };
  }
}

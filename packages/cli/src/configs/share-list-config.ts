import { IShareIncomingOutGoingReponse } from '@meeco/sdk';
import { Share } from '@meeco/vault-api-sdk';

export class ShareListConfig {
  static kind = 'Shares';

  constructor(public readonly templateName: string, public readonly itemList: Share) {}

  static encodeFromJson(json: IShareIncomingOutGoingReponse, metadata?: {}) {
    return {
      kind: ShareListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json.shares,
    };
  }
}

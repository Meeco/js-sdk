import { Item, Share } from '@meeco/vault-api-sdk';

type IShareListTemplate = Array<{
  connection_id: string;
  share_id: string;
  item?: Item;
}>;

export class ShareListConfig {
  static kind = 'Shares';

  constructor(public readonly templateName: string, public readonly itemList: IShareListTemplate) {}

  static encodeFromResult(result: { shares: Share[] }) {
    const shares = (result.shares || []).map(share => {
      return {
        share_id: share.id,
        connection_id: share.connection_id
      };
    });
    return ShareListConfig.encodeFromJson({ shares });
  }

  static encodeFromJson(json: { shares: IShareListTemplate }, metadata?: {}) {
    return {
      kind: ShareListConfig.kind,
      ...(metadata ? { metadata } : {}),
      spec: json.shares
    };
  }
}

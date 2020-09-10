import { ITemplateData } from '@meeco/sdk';
import { ItemTemplatesResponse } from '@meeco/vault-api-sdk';

export class TemplateConfig {
  static readonly kind = 'Template';
  static readonly pluralKind = 'Templates';

  static encodeFromJSON(json: ITemplateData | ITemplateData[]) {
    if (Array.isArray(json) && json.length > 1) {
      return {
        kind: TemplateConfig.pluralKind,
        spec: json.map(template => ({
          ...template,
          slots: template.slots,
        })),
      };
    }

    if (Array.isArray(json)) {
      // Single result - just use it.
      json = json[0];
    }

    return {
      kind: TemplateConfig.kind,
      spec: {
        ...json.template,
        slots: json.slots,
      },
    };
  }

  static encodeListFromJSON(json: ItemTemplatesResponse) {
    return {
      kind: TemplateConfig.pluralKind,
      spec: json.item_templates.map(template => template.name),
    };
  }
}

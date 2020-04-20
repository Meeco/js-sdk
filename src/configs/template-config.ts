import { ItemTemplateWithoutAssociations, Slot } from '@meeco/vault-api-sdk';

export class TemplateConfig {
  static readonly kind = 'Template';
  static readonly pluralKind = 'Templates';

  static encodeFromTemplateWithSlots(
    template: ItemTemplateWithoutAssociations,
    slots: Slot[] = []
  ) {
    return {
      kind: TemplateConfig.kind,
      spec: {
        ...template,
        slots
      }
    };
  }

  static encodeFromList(templates: ItemTemplateWithoutAssociations[] = []) {
    return {
      kind: TemplateConfig.pluralKind,
      spec: templates.map(template => template.name)
    };
  }
}

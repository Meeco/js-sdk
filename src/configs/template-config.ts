import { ItemTemplate, Slot } from '@meeco/meeco-api-sdk';

export class TemplateConfig {
  static readonly kind = 'Template';
  static readonly pluralKind = 'Templates';

  static encodeFromTemplateWithSlots(template: ItemTemplate, slots: Slot[] = []) {
    return {
      kind: TemplateConfig.kind,
      spec: {
        ...template,
        slots
      }
    };
  }

  static encodeFromList(templates: ItemTemplate[] = []) {
    return {
      kind: TemplateConfig.pluralKind,
      spec: templates.map(template => template.name)
    };
  }
}

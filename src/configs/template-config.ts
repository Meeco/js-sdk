import { TemplateData } from '../models/template-data';

export class TemplateConfig {
  static readonly kind = 'Template';
  static readonly pluralKind = 'Templates';

  static encodeFromTemplateData(data: TemplateData) {
    return {
      kind: TemplateConfig.kind,
      spec: data
    };
  }

  static encodeFromList(data: TemplateData[]) {
    return {
      kind: TemplateConfig.pluralKind,
      spec: data.map(templateData => templateData.template.name)
    };
  }
}

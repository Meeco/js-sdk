import { ItemTemplateApi } from '@meeco/vault-api-sdk';
import { CLIError } from '@oclif/errors';
import { TemplateConfig } from '../configs/template-config';
import { IEnvironment } from '../models/environment';
import { vaultAPIFactory } from '../util/api-factory';

export class TemplatesService {
  private api: ItemTemplateApi;

  constructor(environment: IEnvironment, vaultAccessToken: string) {
    this.api = vaultAPIFactory(environment)(vaultAccessToken).ItemTemplateApi;
  }

  public async listTemplates(classificationScheme: string, classificationName: string) {
    const result = await this.api.itemTemplatesGet(classificationScheme, classificationName);
    return TemplateConfig.encodeFromList(result.item_templates);
  }

  public async getTemplate(classificationScheme: string, classificationName: string, name: string) {
    const result = await this.api.itemTemplatesGet(classificationScheme, classificationName);
    const template = result.item_templates?.find(_template => _template.name === name);
    if (!template) {
      throw new CLIError(
        `Template '${name}' not found of classification name '${classificationName}' and scheme ${classificationScheme}`
      );
    }
    const slots = result.slots?.filter(slot => template.slot_ids?.includes(slot.id!));
    return TemplateConfig.encodeFromTemplateWithSlots(template, slots);
  }
}

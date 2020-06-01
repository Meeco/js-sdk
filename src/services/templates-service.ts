import { ItemTemplateApi } from '@meeco/vault-api-sdk';
import { Environment } from '../models/environment';
import { MeecoServiceError } from '../models/service-error';
import { ITemplateData } from '../models/template-data';
import { vaultAPIFactory } from '../util/api-factory';

export class TemplatesService {
  private api: ItemTemplateApi;

  constructor(environment: Environment, vaultAccessToken: string) {
    this.api = vaultAPIFactory(environment)(vaultAccessToken).ItemTemplateApi;
  }

  public async listTemplates(classificationScheme: string, classificationName: string) {
    return await this.api.itemTemplatesGet(classificationScheme, classificationName);
  }

  public async getTemplate(
    classificationScheme: string,
    classificationName: string,
    name: string
  ): Promise<ITemplateData> {
    const result = await this.api.itemTemplatesGet(classificationScheme, classificationName);
    const template = result.item_templates?.find(_template => _template.name === name);
    if (!template) {
      throw new MeecoServiceError(
        `Template '${name}' not found of classification name '${classificationName}' and scheme ${classificationScheme}`
      );
    }
    const slots = result.slots?.filter(slot => template.slot_ids?.includes(slot.id!));
    const classification_nodes = result.classification_nodes.filter(classifcationNode =>
      template.classification_node_ids.includes(classifcationNode.id)
    );

    return {
      template,
      slots,
      classification_nodes
    };
  }
}

import { ItemTemplateApi } from '@meeco/vault-api-sdk';
import { Environment } from '../models/environment';
import { MeecoServiceError } from '../models/service-error';
import { ITemplateData } from '../models/template-data';
import { Logger, noopLogger } from '../util/logger';
import Service, { IVaultToken } from './service';

/**
 * List and fetch available templates for Meeco Items from the API.
 *
 * @deprecated Use [vaultApiFactory] ItemTemplateApi list instead.
 */
export class TemplatesService extends Service<ItemTemplateApi> {
  private api: ItemTemplateApi;

  constructor(environment: Environment, vaultAccessToken: string, log: Logger = noopLogger) {
    super(environment, log);
    this.api = this.getAPI({ vault_access_token: vaultAccessToken });
  }

  public async listTemplates(classificationScheme?: string, classificationName?: string) {
    return await this.api.itemTemplatesGet(classificationScheme, classificationName);
  }

  public getAPI(token: IVaultToken): ItemTemplateApi {
    return this.vaultAPIFactory(token.vault_access_token).ItemTemplateApi;
  }

  /**
   * @deprecated Use [vaultApiFactory] ItemTemplateApi list or get by id instead.
   */
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
    const classification_nodes = result.classification_nodes.filter(classificationNode =>
      template.classification_node_ids.includes(classificationNode.id)
    );

    return {
      template,
      slots,
      classification_nodes,
    };
  }
}

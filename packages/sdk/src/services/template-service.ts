import { ItemTemplateApi, ItemTemplatesResponse } from '@meeco/vault-api-sdk';
import { SDKTemplate } from '../models/sdk-template';
import { getAllPaged, pagedToGenerator, reducePages } from '../util/paged';
import Service, { IPageOptions, IVaultToken } from './service';

/**
 * List and fetch available templates for Meeco Items from the API.
 */
export class TemplateService extends Service<ItemTemplateApi> {
  public getAPI(token: IVaultToken): ItemTemplateApi {
    return this.vaultAPIFactory(token).ItemTemplateApi;
  }

  public async list(
    credentials: IVaultToken,
    spec?: {
      classificationScheme?: string;
      classificationName?: string;
      like?: string;
    },
    options?: IPageOptions
  ): Promise<ItemTemplatesResponse> {
    return this.vaultAPIFactory(credentials).ItemTemplateApi.itemTemplatesGet(
      spec?.classificationScheme,
      spec?.classificationName,
      spec?.like,
      options?.nextPageAfter,
      options?.perPage
    );
  }

  public async listAll(
    credentials: IVaultToken,
    spec?: {
      classificationScheme?: string;
      classificationName?: string;
      like?: string;
    }
  ): Promise<ItemTemplatesResponse> {
    const api = this.vaultAPIFactory(credentials).ItemTemplateApi;

    return getAllPaged(cursor =>
      api.itemTemplatesGet(spec?.classificationScheme, spec?.classificationName, spec?.like, cursor)
    ).then(reducePages);
  }

  public async get(credentials: IVaultToken, id: string): Promise<SDKTemplate> {
    const response = await this.vaultAPIFactory(credentials).ItemTemplateApi.itemTemplatesIdGet(id);
    return SDKTemplate.fromAPI(response);
  }

  /**
   * Search for an ItemTemplate by name, returning `undefined` if it is not found.
   *
   * Note that this patches a missing API method, so may take longer than expected to execute.
   * Any call will cause at least two API calls, possibly many more if there are lots of templates.
   */
  public async findByName(
    credentials: IVaultToken,
    name: string,
    spec?: {
      classificationScheme?: string;
      classificationName?: string;
      like?: string;
    }
  ): Promise<SDKTemplate | undefined> {
    const api = this.vaultAPIFactory(credentials).ItemTemplateApi;

    const pages = pagedToGenerator(cursor =>
      api.itemTemplatesGet(spec?.classificationScheme, spec?.classificationName, spec?.like, cursor)
    );

    for (const templateP of pages) {
      const templates: ItemTemplatesResponse = await templateP;
      const result = templates.item_templates.find(x => x.name === name);
      if (result) {
        // ensure we have the right slots and attachments by calling the API directly
        return api.itemTemplatesIdGet(result.id).then(SDKTemplate.fromAPI);
      }
    }

    return undefined;
  }
}

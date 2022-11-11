import {
  CreateDidDto,
  DeactivateDidDto,
  DidControllerResolve200Response,
  DIDCreateResultDto,
  DIDDeactivateResultDto,
  DIDManagementApi,
  DIDUpdateResultDto,
  UpdateDidDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase, SupportedDidDocumentOperation } from '../models/did-management/did-base';
import Service, { IIdentityNetworkToken } from './service';

export type MediaType =
  | 'application/json'
  | 'application/did+ld+json'
  | 'application/ld+json;profile="https://w3id.org/did-resolution"';

/**
 * Manage did's.
 */
export class DIDManagementService extends Service<DIDManagementApi> {
  public getAPI(token: IIdentityNetworkToken) {
    return this.identityNetworkAPIFactory(token).DIDManagementApi;
  }

  /**
   *
   * @param credentials
   * @param identifier
   * @param accept - The requested media type of the DID document representation or DID resolution result. See https://www.w3.org/TR/did-core/#representations and https://w3c-ccg.github.io/did-resolution/#did-resolution-result.
   * @returns - Promise<DIDResolutionResultDto | DidDocumentDto> based on accept header input
   */
  public resolve(
    credentials: IIdentityNetworkToken,
    organisationID: string,
    identifier: string,
    accept: MediaType = 'application/ld+json;profile="https://w3id.org/did-resolution"'
  ): Promise<DidControllerResolve200Response> {
    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    return api.didControllerResolve(organisationID, identifier, accept);
  }

  /**
   * Supported DID key, web, indy
   *
   * @param credentials
   * @param did - DID to be created e.g. INDY, WEB & KEY
   * @returns - Promise<DIDCreateResultDto>
   */
  public async create(
    credentials: IIdentityNetworkToken,
    organisationID: string,
    did: DIDBase
  ): Promise<DIDCreateResultDto> {
    const createDidDto = {
      options: did.options,
      didDocument: did.didDocument,
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    const initialResult = await api.didControllerCreate(organisationID, did.method, createDidDto);

    // process multi-step did creation with client-manage secret
    const handlerChain = did.getHandlerChain<DIDCreateResultDto, CreateDidDto>();
    return handlerChain
      ? handlerChain.processRequestResponse(initialResult, (method, dto) =>
          api.didControllerCreate(organisationID, method, dto)
        )
      : initialResult;
  }

  /**
   * Supported DID key, web, indy
   *
   * @param credentials
   * @param did - DID to be updated e.g. Indy, WEB & KEY
   * @returns - Promise<DIDUpdateResultDto>
   */
  public async update(
    credentials: IIdentityNetworkToken,
    organisationID: string,
    did: DIDBase
  ): Promise<DIDUpdateResultDto> {
    const updateDidDto = {
      options: did.options,
      didDocument: did.didDocument,
      did: did.didDocument.id!,
      didDocumentOperation: [SupportedDidDocumentOperation.SET_DID_DOCUMENT],
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;

    try {
      const initialResult = await api.didControllerUpdate(organisationID, did.method, updateDidDto);
      // process multi-step did update with client-manage secret
      const handlerChain = did.getHandlerChain<DIDUpdateResultDto, UpdateDidDto>();
      return handlerChain
        ? handlerChain.processRequestResponse(initialResult, (method, dto) =>
            api.didControllerUpdate(organisationID, method, dto)
          )
        : initialResult;
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   * Supported DID key, web, indy
   *
   * @param credentials
   * @param did - DID to be updated e.g. INDY, WEB & KEY
   * @returns - Promise<DIDUpdateResultDto>
   */
  public async deactivate(
    credentials: IIdentityNetworkToken,
    organisationID: string,
    did: DIDBase
  ): Promise<DIDDeactivateResultDto> {
    const deactivateDidDto = {
      options: did.options,
      did: did.didDocument.id!,
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;

    try {
      const initialResult = await api.didControllerDeactivate(
        organisationID,
        did.method,
        deactivateDidDto
      );
      // process multi-step did deactivate
      const handlerChain = did.getHandlerChain<DIDDeactivateResultDto, DeactivateDidDto>();
      return handlerChain
        ? handlerChain.processRequestResponse(initialResult, (method, dto) =>
            api.didControllerDeactivate(organisationID, method, dto)
          )
        : initialResult;
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }
}

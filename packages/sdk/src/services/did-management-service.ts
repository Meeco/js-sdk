import {
  DIDCreateResultDto,
  DIDDeactivateResultDto,
  DidDocumentDto,
  DIDManagementApi,
  DIDResolutionResultDto,
  DIDUpdateResultDto,
} from '@meeco/identity-network-api-sdk';
import { DIDBase } from '../models/did-management/did-base';
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
    identifier: string,
    accept: MediaType = 'application/ld+json;profile="https://w3id.org/did-resolution"'
  ): Promise<DIDResolutionResultDto | DidDocumentDto> {
    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    return api.didControllerResolve(identifier, accept) as Promise<
      DIDResolutionResultDto | DidDocumentDto
    >;
  }

  /**
   * Supported DID key, web, ebsi, sov
   *
   * @param credentials
   * @param did - DID to be created e.g. SOV, WEB & KEY
   * @returns - Promise<DIDCreateResultDto>
   */
  public async create(
    credentials: IIdentityNetworkToken,
    did: DIDBase
  ): Promise<DIDCreateResultDto> {
    const createDidDto = {
      options: did.options,
      didDocument: did.didDocument,
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    const initialResult = await api.didControllerCreate(did.method, createDidDto);

    // process multi-step did creation with client-manage secret
    const handlerChain = did.getCreateHandlerChain();
    return handlerChain
      ? handlerChain.processCreateRequestResponse(initialResult, (method, dto) =>
          api.didControllerCreate(method, dto)
        )
      : initialResult;
  }

  /**
   * Supported DID key, web, ebsi, sov
   *
   * @param credentials
   * @param did - DID to be updated e.g. SOV, WEB & KEY
   * @returns - Promise<DIDUpdateResultDto>
   */
  public async update(
    credentials: IIdentityNetworkToken,
    did: DIDBase
  ): Promise<DIDUpdateResultDto> {
    const updateDidDto = {
      options: did.options,
      didDocument: did.didDocument,
      did: did.didDocument.id!,
      didDocumentOperation: [],
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;

    try {
      const initialResult = await api.didControllerUpdate(did.method, updateDidDto);
      // process multi-step did update with client-manage secret
      const handlerChain = did.getUpdateHandlerChain();
      return handlerChain
        ? handlerChain.processUpdateRequestResponse(initialResult, (method, dto) =>
            api.didControllerUpdate(method, dto)
          )
        : initialResult;
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   * Supported DID key, web, ebsi, sov
   *
   * @param credentials
   * @param did - DID to be updated e.g. SOV, WEB & KEY
   * @returns - Promise<DIDUpdateResultDto>
   */
  public async deactivate(
    credentials: IIdentityNetworkToken,
    did: DIDBase
  ): Promise<DIDDeactivateResultDto> {
    const deactivateDidDto = {
      options: did.options,
      did: did.didDocument.id!,
    };

    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;

    try {
      const initialResult = await api.didControllerDeactivate(did.method, deactivateDidDto);
      // process multi-step did update with client-manage secret
      const handlerChain = did.getDeleteHandlerChain();
      return handlerChain
        ? handlerChain.processDeactivateRequestResponse(initialResult, (method, dto) =>
            api.didControllerDeactivate(method, dto)
          )
        : initialResult;
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }
}

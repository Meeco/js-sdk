import {
  DIDCreateResultDto,
  DidDocumentDto,
  DIDManagementApi,
  DIDResolutionResultDto,
} from '@meeco/identity-network-api-sdk';
import { NewDID } from '../models/new-did';
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
   * @param newDID - DID to be created e.g. SOV, WEB & KEY
   * @returns - Promise<DIDCreateResultDto>
   */
  public async create(
    credentials: IIdentityNetworkToken,
    newDID: NewDID
  ): Promise<DIDCreateResultDto> {
    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    const initialResult = await api.didControllerCreate(newDID.method, {
      options: {
        clientSecretMode: true,
        network: newDID.network,
      },
      didDocument: newDID.didDocument,
    });

    // process multi-step did creation with client-manage secret
    const handlerChain = newDID.getHandlerChain();
    return handlerChain.processRequestResponse(initialResult, api);
  }
}

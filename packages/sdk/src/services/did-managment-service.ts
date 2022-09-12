import {
  DidDocumentDto,
  DIDManagementApi,
  DIDResolutionResultDto,
} from '@meeco/identity-network-api-sdk';
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
   * @returns Promise<DIDResolutionResultDto | DidDocumentDto>
   */
  public async resolve(
    credentials: IIdentityNetworkToken,
    identifier: string,
    accept: MediaType = 'application/ld+json;profile="https://w3id.org/did-resolution"'
  ): Promise<DIDResolutionResultDto | DidDocumentDto> {
    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    return api.didControllerResolve(identifier, accept);
  }
}

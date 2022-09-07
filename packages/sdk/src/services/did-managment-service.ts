import { DIDManagementApi } from 'identity-network-api-sdk';
import Service, { IIdentityNetworkToken } from './service';

/**
 * Manage did's from the API.
 */
export class DIDManagementService extends Service<DIDManagementApi> {
  public getAPI(token: IIdentityNetworkToken) {
    return this.identityNetworkAPIFactory(token).DIDManagementApi;
  }

  /**
   *
   */
  public async resolve(credentials: IIdentityNetworkToken) {
    const api = this.identityNetworkAPIFactory(credentials).DIDManagementApi;
    return api.didControllerResolve('did:key:z6MkuS4gudyuiFp5MGTsFfPSyn4uUQKhY8vFFzPMNQDANoLd');
  }
}

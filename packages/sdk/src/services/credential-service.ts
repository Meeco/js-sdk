import { CredentialsApi, GenerateCredentialDto } from '@meeco/vc-api-sdk';
import { Ed25519 } from '../models/did-management';
import { MeecoServiceError } from '../models/service-error';
import { signUnsignedJWT } from '../util/jwt';
import Service, { IVCToken } from './service';

/**
 * Manage verifiable credentials
 */
export class CredentialService extends Service<CredentialsApi> {
  public getAPI(token: IVCToken) {
    return this.vcAPIFactory(token).CredentialsApi;
  }

  /**
   *
   * @param credentials
   * @param payload - credential type, claims and basic credential parameters
   * @param organisationID - signing organisation ID
   * @param key - instance of Ed25519
   * @returns Promise<{credential: string; metadata: {style: {"text-color": string, background: string, image: string}}}>
   */
  public async issue(credentials: IVCToken, payload: GenerateCredentialDto, key: Ed25519) {
    if (!credentials.organisation_id) {
      throw new MeecoServiceError(
        'credentials.organisation_id parameter is required to issue a credential'
      );
    }

    const result = await this.getAPI(credentials).credentialsControllerGenerate(
      credentials.organisation_id,
      { credential: payload }
    );

    const signedCredential = await signUnsignedJWT(
      result.credential.unsigned_vc_jwt,
      payload.issuer.id,
      key
    );

    return {
      credential: signedCredential,
      metadata: result.credential.metadata,
    };
  }
}

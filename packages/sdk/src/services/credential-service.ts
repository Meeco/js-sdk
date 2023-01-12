import { CredentialsApi, GenerateCredentialDto } from '@meeco/vc-api-sdk';
import { Ed25519 } from '../models/did-management';
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
  public async issue(
    credentials: IVCToken,
    payload: GenerateCredentialDto,
    organisationID: string,
    key: Ed25519
  ) {
    const result = await this.vcAPIFactory(
      credentials
    ).CredentialsApi.credentialsControllerGenerate(organisationID, { credential: payload });

    const signedCredential = await signUnsignedJWT(
      result.credential.unsigned_vc_jwt,
      payload.issuer,
      key
    );

    return {
      credential: signedCredential,
      metadata: result.credential.metadata,
    };
  }
}

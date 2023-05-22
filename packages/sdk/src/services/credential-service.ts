import { CredentialsApi, GenerateCredentialDto } from '@meeco/vc-api-sdk';
import { MeecoServiceError } from '../models/service-error';
import { SigningAlg, signUnsignedJWT } from '../util/jwt';
import Service, { IVCToken } from './service';

/**
 * Manage verifiable credentials
 */
export interface GenerateCredentialExtendedDto extends Omit<GenerateCredentialDto, 'issuer'> {
  issuer: string | { id: string; name?: string };
}

export class CredentialService extends Service<CredentialsApi> {
  public getAPI(token: IVCToken) {
    return this.vcAPIFactory(token).CredentialsApi;
  }

  /**
   *
   * @param credentials
   * @param payload - credential type, claims and basic credential parameters
   * @param organisationID - signing organisation ID
   * @param key - private key bytes in a form of Uint8Array
   * @param alg - SigningAlg enum value
   * @returns Promise<{credential: string; metadata: {style: {"text-color": string, background: string, image: string}}}>
   */
  public async issue(
    credentials: IVCToken,
    payload: GenerateCredentialExtendedDto,
    key: Uint8Array,
    alg: SigningAlg
  ) {
    if (!credentials.organisation_id) {
      throw new MeecoServiceError(
        'credentials.organisation_id parameter is required to issue a credential'
      );
    }

    const result = await this.getAPI(credentials).credentialsControllerGenerate(
      credentials.organisation_id,
      { credential: <any>payload }
    );

    const signedCredential = await signUnsignedJWT(
      result.credential.unsigned_vc_jwt,
      typeof payload.issuer === 'string' ? payload.issuer : payload.issuer.id,
      key,
      alg
    );

    return {
      credential: signedCredential,
      metadata: result.credential.metadata,
    };
  }
}

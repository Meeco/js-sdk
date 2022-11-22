import { CredentialsApi, GenerateCredentialDto } from '@meeco/vc-api-sdk';
import { Ed25519 } from '../models/did-management';
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

    const signature = await this.sign(result.credential.unsigned_vc_jwt, key);

    return {
      credential: [result.credential.unsigned_vc_jwt, signature].join('.'),
      metadata: result.credential.metadata,
    };
  }

  private sign(data: string | Uint8Array, key: Ed25519) {
    const toSign = typeof data === 'string' ? new Uint8Array(Buffer.from(data)) : data;
    const signature = key.sign(toSign);

    return Promise.resolve(Buffer.from(signature).toString('base64url'));
  }
}

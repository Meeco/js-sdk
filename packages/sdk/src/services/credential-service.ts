import { CredentialsApi, GenerateCredentialDto } from '@meeco/vc-api-sdk';
import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import { createJWT, decodeJWT, EdDSASigner } from 'did-jwt';
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

    const signedCredential = await this.signJWT(
      result.credential.unsigned_vc_jwt,
      payload.issuer,
      key
    );

    return {
      credential: signedCredential,
      metadata: result.credential.metadata,
    };
  }

  private signJWT(unsignedJWT: string | Uint8Array, issuer: string, key: Ed25519) {
    const signer = EdDSASigner(generateKeyPairFromSeed(key.keyPair.secret()).secretKey);
    const decoded = decodeJWT(`${unsignedJWT}.unsigned`);

    return createJWT(decoded.payload, { issuer, signer }, decoded.header);
  }
}

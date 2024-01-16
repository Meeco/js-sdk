import {
  CreateCredentialTypeStyleDto,
  CredentialTypeModelDto,
  CredentialsApi,
  CredentialsControllerGenerateAcceptEnum,
  GenerateCredentialDto,
} from '@meeco/vc-api-sdk';
import { JWTPayload, decodeJWT } from 'did-jwt';
import { DecryptedItem } from '../models/decrypted-item';
import { NewItem } from '../models/new-item';
import { MeecoServiceError } from '../models/service-error';
import { SlotType } from '../models/slot-types';
import { CREDENTIAL_FORMAT, CREDENTIAL_ITEM } from '../util/constants';
import { SigningAlg, signUnsignedJWT } from '../util/jwt';
import { DecryptedItems, ItemService } from './item-service';
import Service, { IDEK, IVCToken, IVaultToken } from './service';

/**
 * Manage verifiable credentials
 */
export interface GenerateCredentialExtendedDto extends Omit<GenerateCredentialDto, 'issuer'> {
  issuer: string | { id: string; name?: string };
}

export interface CreateVerifiableCredentialItemParams {
  credentialJWT: string;
  credentialType?: CredentialTypeModelDto;
}
export class CredentialService extends Service<CredentialsApi> {
  public getAPI(token: IVCToken) {
    return this.vcAPIFactory(token).CredentialsApi;
  }

  /**
   *
   * @param auth
   * @param payload - credential type, claims and basic credential parameters
   * @param organisationID - signing organisation ID
   * @param key - private key bytes in a form of Uint8Array
   * @param alg - SigningAlg enum value
   * @param jwtFormat - optional parameter to specify JWT format (default is VC-JWT)
   * @returns Promise<{credential: string; metadata: {style: {"text-color": string, background: string, image: string}}}>
   */
  public async issue(
    auth: IVCToken,
    payload: GenerateCredentialExtendedDto,
    key: Uint8Array,
    alg: SigningAlg,
    jwtFormat?: CredentialsControllerGenerateAcceptEnum
  ) {
    if (!auth.organisation_id) {
      throw new MeecoServiceError(
        'credentials.organisation_id parameter is required to issue a credential'
      );
    }

    jwtFormat = jwtFormat || CredentialsControllerGenerateAcceptEnum.Jwt;
    const result = await this.getAPI(auth).credentialsControllerGenerate(
      auth.organisation_id,
      {
        credential: <any>payload,
      },
      jwtFormat
    );

    let unsigned_vc_jwt =
      jwtFormat && jwtFormat === CredentialsControllerGenerateAcceptEnum.VcsdJwt
        ? result.credential.unsigned_vc_jwt.split('~')[0]
        : result.credential.unsigned_vc_jwt;

    if (unsigned_vc_jwt.endsWith('.')) {
      unsigned_vc_jwt = unsigned_vc_jwt.slice(0, -1);
    }

    const signedCredential = await signUnsignedJWT(
      unsigned_vc_jwt,
      typeof payload.issuer === 'string' ? payload.issuer : payload.issuer.id,
      key,
      alg
    );

    const credential =
      jwtFormat === CredentialsControllerGenerateAcceptEnum.VcsdJwt
        ? signedCredential +
          result.credential.unsigned_vc_jwt.slice(result.credential.unsigned_vc_jwt.indexOf('~'))
        : signedCredential;

    return {
      credential,
      metadata: result.credential.metadata,
    };
  }

  public async createVerifiableCredentialItem(
    auth: IVaultToken & IDEK,
    { credentialJWT, credentialType }: CreateVerifiableCredentialItemParams
  ): Promise<DecryptedItem> {
    const itemService = new ItemService(this.environment);

    const decodedCredential = decodeJWT(credentialJWT.split('~')[0]);
    const credentialFormat = credentialJWT.includes('~')
      ? CREDENTIAL_FORMAT.SD_JWT_VC
      : CREDENTIAL_FORMAT.JWT_VC;

    const vcClaims = this.getVcClaims(decodedCredential.payload, credentialFormat);

    const slots = [
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.JWT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.JWT_SLOT_NAME,
        value: credentialJWT,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_NAME,
        value: credentialFormat,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_SLOT_NAME,
        value: typeof vcClaims.issuer === 'string' ? vcClaims.issuer : vcClaims.issuer.id,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SUBJECT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.SUBJECT_SLOT_NAME,
        value: vcClaims.subject,
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.ISSUED_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUED_AT_SLOT_NAME,
        value: new Date(vcClaims.issuanceDate).toJSON(),
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_NAME,
        value: vcClaims.expirationDate ? new Date(vcClaims.expirationDate).toJSON() : null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_NAME,
        value: vcClaims.id,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SCHEMA_URL_LABEL,
        name: CREDENTIAL_ITEM.SCHEMA_URL_NAME,
        value: vcClaims.credentialSchema?.id || null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_NAME,
        value: credentialType?.id || null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_NAME,
        value: credentialType?.name || null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.STYLES_SLOT_LABEL,
        name: CREDENTIAL_ITEM.STYLES_SLOT_NAME,
        value: credentialType?.style ? this.formatStyles(credentialType.style) : null,
      },
      {
        slot_type_name: SlotType.Bool,
        label: CREDENTIAL_ITEM.REVOCABLE_SLOT_LABEL,
        name: CREDENTIAL_ITEM.REVOCABLE_SLOT_NAME,
        value: vcClaims.revocable ? 'true' : 'false',
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_NAME,
        value: vcClaims.issuer?.name || null,
      },
    ];

    const newVerifiableCredentialItem = new NewItem(
      vcClaims.id,
      CREDENTIAL_ITEM.TEMPLATE_NAME,
      slots,
      undefined,
      this.formatIdToItemName(vcClaims.id)
    );

    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      data_encryption_key: auth.data_encryption_key,
    };

    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    return itemService.create(itemServiceAuth, newVerifiableCredentialItem);
  }

  public async findVerifiableCredentialItemsById(
    auth: IVaultToken & IDEK,
    credentialId: string
  ): Promise<DecryptedItems> {
    const itemService = new ItemService(this.environment);
    credentialId = this.formatIdToItemName(credentialId);

    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      data_encryption_key: auth.data_encryption_key,
    };

    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    return await itemService.listDecrypted(itemServiceAuth, { name: credentialId });
  }

  /**
   * Helpers
   */

  private formatIdToItemName(id: string) {
    /**
     * For credentials starting with urn:uuid: it will crop it and leave only uuid part
     * Regular uuids will not be changed
     */
    const processedId = id.replace(/[^a-z0-9-]/gi, '_');
    return processedId.slice(processedId.lastIndexOf('_') + 1);
  }

  private formatStyles(styles: CreateCredentialTypeStyleDto) {
    if (!styles) {
      return null;
    }

    /**
     * Format that Portal is using
     */
    return JSON.stringify({
      backgroundColor: styles.background,
      textColor: styles.text_color,
      logo: styles.image,
    });
  }

  private isSdJwtVc(format: string) {
    return CREDENTIAL_FORMAT.SD_JWT_VC === format;
  }

  private getVcClaims(payload: JWTPayload, format: string) {
    return this.isSdJwtVc(format)
      ? {
          issuer: payload.iss,
          subject: payload?.sub || null,
          issuanceDate: payload.iat,
          expirationDate: payload.exp,
          id: payload.jti,
          credentialSchema: null,
          revocable: false,
        }
      : {
          issuer: payload.vc.issuer,
          subject: payload.vc.credentialSubject.id,
          issuanceDate: payload.vc.issuanceDate,
          expirationDate: payload.vc.expirationDate,
          id: payload.vc.id,
          credentialSchema: payload.vc.credentialSchema,
          revocable: payload.vc.credentialStatus,
        };
  }
}

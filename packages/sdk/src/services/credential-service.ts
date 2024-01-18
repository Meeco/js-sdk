import {
  CreateCredentialTypeStyleDto,
  CredentialTypeModelDto,
  CredentialsApi,
  CredentialsControllerGenerateAcceptEnum,
  GenerateCredentialDto,
} from '@meeco/vc-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import { NewItem } from '../models/new-item';
import { MeecoServiceError } from '../models/service-error';
import { SlotType } from '../models/slot-types';
import { CREDENTIAL_ITEM } from '../util/constants';
import { SigningAlg, signUnsignedJWT } from '../util/jwt';
import { DecryptedItems, ItemService } from './item-service';
import Service, { IDEK, IVCToken, IVaultToken } from './service';

/**
 * Manage verifiable credentials
 */
export interface GenerateCredentialExtendedDto extends Omit<GenerateCredentialDto, 'issuer'> {
  issuer: string | { id: string; name?: string };
}

export interface CredentialDetail {
  issuer: any | null;
  subject: string | null;
  issuanceDate: Date | null;
  expirationDate: Date | null;
  id: string | null;
  credentialSchema: any | null;
  revocable: boolean | null;
}

export interface CreateVerifiableCredentialItemParams {
  credential: string;
  format: string;
  id: string;
  credentialDetail?: CredentialDetail;
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
    {
      credential,
      format,
      id,
      credentialDetail,
      credentialType,
    }: CreateVerifiableCredentialItemParams
  ): Promise<DecryptedItem> {
    const slots = this.createSlots(credential, format, credentialDetail, credentialType);

    const newVerifiableCredentialItem = new NewItem(
      id,
      CREDENTIAL_ITEM.TEMPLATE_NAME,
      slots,
      undefined,
      id
    );

    const itemService = new ItemService(this.environment);
    const itemServiceAuth = this.createItemServiceAuth(auth);

    return itemService.create(itemServiceAuth, newVerifiableCredentialItem);
  }

  public async findVerifiableCredentialItemsById(
    auth: IVaultToken & IDEK,
    id: string
  ): Promise<DecryptedItems> {
    const itemService = new ItemService(this.environment);
    const itemServiceAuth = this.createItemServiceAuth(auth);

    return await itemService.listDecrypted(itemServiceAuth, { name: id });
  }

  /**
   * Helpers
   */

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

  private createItemServiceAuth(auth: IVaultToken & IDEK) {
    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      data_encryption_key: auth.data_encryption_key,
    };

    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    return itemServiceAuth;
  }

  private createSlots(
    credential: string,
    format: string,
    credentialDetail?: CredentialDetail,
    credentialType?: CredentialTypeModelDto
  ) {
    return [
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_SLOT_NAME,
        value: credential,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_NAME,
        value: format,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_SLOT_NAME,
        value: credentialDetail?.issuer
          ? typeof credentialDetail.issuer === 'string'
            ? credentialDetail.issuer
            : credentialDetail.issuer?.id || null
          : null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SUBJECT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.SUBJECT_SLOT_NAME,
        value: credentialDetail?.subject || null,
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.ISSUED_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUED_AT_SLOT_NAME,
        value: credentialDetail?.issuanceDate ? credentialDetail.issuanceDate.toJSON() : null,
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_NAME,
        value: credentialDetail?.expirationDate ? credentialDetail.expirationDate.toJSON() : null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_NAME,
        value: credentialDetail?.id || null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SCHEMA_URL_LABEL,
        name: CREDENTIAL_ITEM.SCHEMA_URL_NAME,
        value: credentialDetail?.credentialSchema?.id ? credentialDetail.credentialSchema.id : null,
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
        value:
          credentialDetail?.revocable === null || credentialDetail?.revocable === undefined
            ? null
            : credentialDetail?.revocable
            ? 'true'
            : 'false',
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_NAME,
        value: credentialDetail?.issuer?.name || null,
      },
    ];
  }
}

import {
  CreateCredentialTypeStyleDto,
  CredentialTypeModelDto,
  CredentialsApi,
  GenerateCredentialDto,
} from '@meeco/vc-api-sdk';
import { decodeJWT } from 'did-jwt';
import { DecryptedItem } from '../models/decrypted-item';
import { NewItem } from '../models/new-item';
import { MeecoServiceError } from '../models/service-error';
import { SlotType } from '../models/slot-types';
import { CREDENTIAL_ITEM } from '../util/constants';
import { SigningAlg, signUnsignedJWT } from '../util/jwt';
import { ItemService } from './item-service';
import Service, { IDEK, IVCToken, IVaultToken } from './service';

/**
 * Manage verifiable credentials
 */
export interface GenerateCredentialExtendedDto extends Omit<GenerateCredentialDto, 'issuer'> {
  issuer: string | { id: string; name?: string };
}

export interface CreateVerifiableCredentialItemParams {
  credentialJWT: string;
  credentialType: CredentialTypeModelDto;
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
   * @returns Promise<{credential: string; metadata: {style: {"text-color": string, background: string, image: string}}}>
   */
  public async issue(
    auth: IVCToken,
    payload: GenerateCredentialExtendedDto,
    key: Uint8Array,
    alg: SigningAlg
  ) {
    if (!auth.organisation_id) {
      throw new MeecoServiceError(
        'credentials.organisation_id parameter is required to issue a credential'
      );
    }

    const result = await this.getAPI(auth).credentialsControllerGenerate(auth.organisation_id, {
      credential: <any>payload,
    });

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

  public async createVerifiableCredentialItem(
    auth: IVaultToken & IDEK,
    { credentialJWT, credentialType }: CreateVerifiableCredentialItemParams
  ): Promise<DecryptedItem> {
    const decodedCredential = decodeJWT(credentialJWT.split('~')[0]);
    const itemService = new ItemService(this.environment);

    const slots = [
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.JWT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.JWT_SLOT_NAME,
        value: credentialJWT,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_SLOT_NAME,
        value:
          typeof decodedCredential.payload.vc.issuer === 'string'
            ? decodedCredential.payload.vc.issuer
            : decodedCredential.payload.vc.issuer.id,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SUBJECT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.SUBJECT_SLOT_NAME,
        value: decodedCredential.payload.vc.credentialSubject.id,
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.ISSUED_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUED_AT_SLOT_NAME,
        value: new Date(decodedCredential.payload.vc.issuanceDate),
      },
      {
        slot_type_name: SlotType.DateTime,
        label: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_LABEL,
        name: CREDENTIAL_ITEM.EXPIRES_AT_SLOT_NAME,
        value: decodedCredential.payload.vc.expirationDate
          ? new Date(decodedCredential.payload.vc.expirationDate)
          : null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_NAME,
        value: decodedCredential.payload.vc.id,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.SCHEMA_URL_LABEL,
        name: CREDENTIAL_ITEM.SCHEMA_URL_NAME,
        value: decodedCredential.payload.vc.credentialSchema?.id || null,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_NAME,
        value: credentialType.id,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_LABEL,
        name: CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_NAME,
        value: credentialType.name,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.STYLES_SLOT_LABEL,
        name: CREDENTIAL_ITEM.STYLES_SLOT_NAME,
        value: this.formatStyles(credentialType.style),
      },
      {
        slot_type_name: SlotType.Bool,
        label: CREDENTIAL_ITEM.REVOCABLE_SLOT_LABEL,
        name: CREDENTIAL_ITEM.REVOCABLE_SLOT_NAME,
        value: decodedCredential.payload.vc.credentialStatus ? true : false,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_LABEL,
        name: CREDENTIAL_ITEM.ISSUER_NAME_SLOT_NAME,
        value: decodedCredential.payload.vc.issuer?.name || null,
      },
    ];

    const newVerifiableCredentialItem = new NewItem(
      decodedCredential.payload.vc.id,
      CREDENTIAL_ITEM.TEMPLATE_NAME,
      slots,
      undefined,
      this.formatIdToItemName(decodedCredential.payload.vc.id)
    );

    return itemService.create(
      {
        vault_access_token: auth.vault_access_token,
        organisation_id: auth.organisation_id,
        data_encryption_key: auth.data_encryption_key,
      },
      newVerifiableCredentialItem
    );
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
}

import {
  CreateCredentialTypeDtoFormatEnum,
  CreateCredentialTypeStyleDto,
  CredentialTypeModelDto,
  CredentialsApi,
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
  issuer?: string | { id: string; name?: string };
  subject?: string;
  issuanceDate?: Date;
  expirationDate?: Date;
  id?: string;
  credentialSchema?: { id: string; type: string };
  revocable?: boolean;
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

    let unsigned_vc_jwt =
      result.credential.format === CreateCredentialTypeDtoFormatEnum.VcsdJwt
        ? result.credential.credential.split('~')[0]
        : result.credential.credential;

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
      result.credential.format === CreateCredentialTypeDtoFormatEnum.VcsdJwt
        ? signedCredential +
          result.credential.credential.slice(result.credential.credential.indexOf('~'))
        : signedCredential;

    return {
      credential,
      format: result.credential.format,
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
    const itemLabelAndName = this.formatIdToItemName(id);

    const newVerifiableCredentialItem = new NewItem(
      itemLabelAndName,
      CREDENTIAL_ITEM.TEMPLATE_NAME,
      slots,
      undefined,
      itemLabelAndName
    );

    const itemService = new ItemService(this.environment);
    const itemServiceAuth = this.createItemServiceAuth(auth);

    return itemService.create(itemServiceAuth, newVerifiableCredentialItem);
  }

  public async findVerifiableCredentialItemsById(
    auth: IVaultToken & IDEK,
    id: string
  ): Promise<DecryptedItems> {
    const itemName = this.formatIdToItemName(id);
    const itemService = new ItemService(this.environment);
    const itemServiceAuth = this.createItemServiceAuth(auth);

    return await itemService.listDecrypted(itemServiceAuth, { name: itemName });
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
    const issuer = credentialDetail?.issuer;
    let issuerId: string | null = null;

    if (issuer) {
      issuerId = typeof issuer === 'string' ? issuer : issuer?.id || null;
    }

    const subject = credentialDetail?.subject || null;
    const issuanceDate = credentialDetail?.issuanceDate
      ? credentialDetail.issuanceDate.toJSON()
      : null;
    const expirationDate = credentialDetail?.expirationDate
      ? credentialDetail.expirationDate.toJSON()
      : null;
    const id = credentialDetail?.id || null;
    const schemaId = credentialDetail?.credentialSchema?.id || null;
    const typeId = credentialType?.id || null;
    const typeName = credentialType?.name || null;
    const style = credentialType?.style ? this.formatStyles(credentialType.style) : null;
    const revocable =
      credentialDetail?.revocable === null || credentialDetail?.revocable === undefined
        ? null
        : credentialDetail?.revocable
        ? 'true'
        : 'false';
    const issuerName =
      (credentialDetail?.issuer as { id: string; name?: string | undefined })?.name || null;

    return [
      this.createSlot(
        CREDENTIAL_ITEM.CREDENTIAL_SLOT_LABEL,
        CREDENTIAL_ITEM.CREDENTIAL_SLOT_NAME,
        credential
      ),
      this.createSlot(
        CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_LABEL,
        CREDENTIAL_ITEM.CREDENTIAL_FORMAT_SLOT_NAME,
        format
      ),
      this.createSlot(
        CREDENTIAL_ITEM.ISSUER_SLOT_LABEL,
        CREDENTIAL_ITEM.ISSUER_SLOT_NAME,
        issuerId
      ),
      this.createSlot(
        CREDENTIAL_ITEM.SUBJECT_SLOT_LABEL,
        CREDENTIAL_ITEM.SUBJECT_SLOT_NAME,
        subject
      ),
      this.createSlot(
        CREDENTIAL_ITEM.ISSUED_AT_SLOT_LABEL,
        CREDENTIAL_ITEM.ISSUED_AT_SLOT_NAME,
        issuanceDate,
        SlotType.DateTime
      ),
      this.createSlot(
        CREDENTIAL_ITEM.EXPIRES_AT_SLOT_LABEL,
        CREDENTIAL_ITEM.EXPIRES_AT_SLOT_NAME,
        expirationDate,
        SlotType.DateTime
      ),
      this.createSlot(
        CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_LABEL,
        CREDENTIAL_ITEM.CREDENTIAL_ID_SLOT_NAME,
        id
      ),
      this.createSlot(CREDENTIAL_ITEM.SCHEMA_URL_LABEL, CREDENTIAL_ITEM.SCHEMA_URL_NAME, schemaId),
      this.createSlot(
        CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_LABEL,
        CREDENTIAL_ITEM.CREDENTIAL_TYPE_ID_NAME,
        typeId
      ),
      this.createSlot(
        CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_LABEL,
        CREDENTIAL_ITEM.CREDENTIAL_TYPE_NAME_SLOT_NAME,
        typeName
      ),
      this.createSlot(CREDENTIAL_ITEM.STYLES_SLOT_LABEL, CREDENTIAL_ITEM.STYLES_SLOT_NAME, style),
      this.createSlot(
        CREDENTIAL_ITEM.REVOCABLE_SLOT_LABEL,
        CREDENTIAL_ITEM.REVOCABLE_SLOT_NAME,
        revocable,
        SlotType.Bool
      ),
      this.createSlot(
        CREDENTIAL_ITEM.ISSUER_NAME_SLOT_LABEL,
        CREDENTIAL_ITEM.ISSUER_NAME_SLOT_NAME,
        issuerName
      ),
    ];
  }

  private createSlot(
    label: string,
    name: string,
    value: any,
    slotType: SlotType = SlotType.KeyValue
  ) {
    return {
      slot_type_name: slotType,
      label,
      name,
      value,
    };
  }

  private formatIdToItemName(id: string) {
    /**
     * For credentials starting with urn:uuid: it will crop it and leave only uuid part
     * Regular uuids will not be changed
     */
    const processedId = id.replace(/[^a-z0-9-]/gi, '_');
    return processedId.slice(processedId.lastIndexOf('_') + 1);
  }
}

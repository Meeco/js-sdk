import {
  PresentationRequestResponseVerificationResultResponseDto,
  PresentationRequestsApi,
} from '@meeco/vc-api-sdk';
import { NewItem } from '../models/new-item';
import { SlotType } from '../models/slot-types';
import { PRESENTATION_REQUEST_RESPONSE_ITEM } from '../util/constants';
import { ItemService } from './item-service';
import Service, { IDEK, IKEK, IKeystoreToken, IVCToken, IVaultToken } from './service';

export interface CreatePresentationRequestResponseItemParams {
  presentationRequestId: string;
  idToken: string;
  vpToken: string;
  presentationSubmission: string;
  state: string;
  verificationResult: PresentationRequestResponseVerificationResultResponseDto;
}

export class PresentationRequestService extends Service<PresentationRequestsApi> {
  public getAPI(token: IVCToken) {
    return this.vcAPIFactory(token).PresentationRequestsApi;
  }

  public async createPresentationRequestResponseItem(
    auth: IVaultToken & IDEK,
    {
      presentationRequestId,
      idToken,
      vpToken,
      presentationSubmission,
      state,
      verificationResult,
    }: CreatePresentationRequestResponseItemParams
  ) {
    const itemService = new ItemService(this.environment);

    const slots = [
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.ID_TOKEN_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.ID_TOKEN_SLOT_NAME,
        value: idToken,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.VP_TOKEN_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.VP_TOKEN_SLOT_NAME,
        value: vpToken,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.PRESENTATION_SUBMISSION_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.PRESENTATION_SUBMISSION_SLOT_NAME,
        value: presentationSubmission,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.STATE_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.STATE_SLOT_NAME,
        value: state,
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.VERIFICATION_RESULT_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.VERIFICATION_RESULT_SLOT_NAME,
        value: JSON.stringify(verificationResult),
      },
      {
        slot_type_name: SlotType.KeyValue,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.PRESENTATION_REQUEST_ID_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.PRESENTATION_REQUEST_ID_SLOT_NAME,
        value: presentationRequestId,
      },
      {
        slot_type_name: SlotType.DateTime,
        label: PRESENTATION_REQUEST_RESPONSE_ITEM.LAST_VERIFIED_AT_SLOT_LABEL,
        name: PRESENTATION_REQUEST_RESPONSE_ITEM.LAST_VERIFIED_AT_SLOT_NAME,
        value: new Date().toJSON(),
      },
    ];

    const newPresentationRequestResponseItem = new NewItem(
      `Presentation request (id: ${presentationRequestId}) response`,
      PRESENTATION_REQUEST_RESPONSE_ITEM.TEMPLATE_NAME,
      slots,
      undefined,
      this.formatIdToItemName(presentationRequestId)
    );

    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      data_encryption_key: auth.data_encryption_key,
    };

    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    return itemService.create(itemServiceAuth, newPresentationRequestResponseItem);
  }

  public async getPresentationRequestResponseItem(
    auth: IVaultToken & IKeystoreToken & IDEK & IKEK,
    itemId: string
  ) {
    const itemService = new ItemService(this.environment);
    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      keystore_access_token: auth.keystore_access_token,
      data_encryption_key: auth.data_encryption_key,
      key_encryption_key: auth.data_encryption_key,
    };
    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    return itemService.get(itemServiceAuth, itemId);
  }

  public async getPresentationRequestResponseItems(
    auth: IVaultToken & IDEK,
    presentationRequestId: string
  ) {
    const itemService = new ItemService(this.environment);
    const itemServiceAuth = {
      vault_access_token: auth.vault_access_token,
      data_encryption_key: auth.data_encryption_key,
    };
    if (auth.organisation_id) {
      itemServiceAuth['organisation_id'] = auth.organisation_id;
    }

    const itemName = this.formatIdToItemName(presentationRequestId);

    return itemService.listDecrypted(itemServiceAuth, { name: itemName });
  }

  public async deletePresentationRequestResponseItem(auth: IVaultToken & IDEK, itemId: string) {
    return this.vaultAPIFactory(auth).ItemApi.itemsIdDelete(itemId);
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
}

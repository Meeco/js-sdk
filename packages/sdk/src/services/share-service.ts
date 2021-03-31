import {
  EncryptedSlotValue,
  GetShareResponse,
  ItemsIdSharesShareDeks,
  PutItemSharesRequest,
  Share,
  SharesApi,
  SharesCreateResponse,
  SharesIncomingResponse,
  SharesOutgoingResponse,
  ShareWithItemData,
} from '@meeco/vault-api-sdk';
import { DecryptedItem } from '../models/decrypted-item';
import RSAPublicKey from '../models/rsa-public-key';
import { MeecoServiceError } from '../models/service-error';
import { SDKDecryptedSlot } from '../models/slot-types';
import { SymmetricKey } from '../models/symmetric-key';
import { getAllPaged, reducePages } from '../util/paged';
import SlotHelpers from '../util/slot-helpers';
import { ConnectionService } from './connection-service';
import { ItemService } from './item-service';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

export enum SharingMode {
  Owner = 'owner',
  Anyone = 'anyone',
}

/** The result of an API call */
export enum AcceptanceStatus {
  Required = 'acceptance_required',
  NotRequired = 'acceptance_not_required',
  Accepted = 'accepted',
  Rejected = 'rejected ',
}

/** Values which can be set by the user */
export enum AcceptanceRequest {
  Required = 'acceptance_required',
  NotRequired = 'acceptance_not_required',
}

function hasAccepted(status: string) {
  return status === AcceptanceStatus.Accepted || status === AcceptanceStatus.NotRequired;
}

export interface IShareOptions {
  slot_id?: string;
  expires_at?: Date;
  terms?: string;
  sharing_mode?: SharingMode;
  acceptance_required?: AcceptanceRequest;
}

export enum ShareType {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

/**
 * Service for sharing data between two connected Meeco users.
 * Connections can be setup via the {@link ConnectionService}
 */
export class ShareService extends Service<SharesApi> {
  /**
   * @visibleForTesting
   * @ignore
   */
  static Date = global.Date;

  /**
   * When a share is initially created it is encrypted with a generated
   * symmetric key, encrypted with the recipient's public key.
   * See {@link getShareDEK} for decrypting that key.
   * @returns true if the share is encrypted with the shared key.
   */
  public static shareEncryptedWithSharedKey(share: Share): boolean {
    return !!share.encrypted_dek;
  }

  public getAPI(token: IVaultToken) {
    return this.vaultAPIFactory(token).SharesApi;
  }

  /**
   * Share the Item with another user (identified by the Connection).
   * You can only share Items you own or are permitted to re-share.
   * @param credentials
   * @param connectionId
   * @param itemId
   * @param shareOptions
   */
  public async shareItem(
    credentials: IVaultToken & IKeystoreToken & IKEK & IDEK,
    connectionId: string,
    itemId: string,
    shareOptions: IShareOptions = {}
  ): Promise<SharesCreateResponse> {
    const fromUserConnection = await new ConnectionService(this.environment, this.logger).get(
      credentials,
      connectionId
    );
    const {
      user_public_key,
      user_keypair_external_id,
      user_id: recipientId,
    } = fromUserConnection.the_other_user;
    const publicKey = new RSAPublicKey(user_public_key);

    this.logger.log('Preparing item to share');
    const item = await new ItemService(this.environment).get(credentials, itemId);
    const { slots } = item;

    this.logger.log('Encrypting slots with generated DEK');
    const dek = SymmetricKey.generate();

    let encryptions: EncryptedSlotValue[];
    if (shareOptions.slot_id) {
      const shareSlot = slots.find(slot => slot.id === shareOptions.slot_id);
      if (!shareSlot) {
        throw new Error(`could not find slot with id ${shareOptions.slot_id}`);
      }
      encryptions = [
        await SlotHelpers.toEncryptedSlotValue(
          {
            data_encryption_key: dek,
          },
          shareSlot
        ),
      ];
    } else {
      encryptions = await item.toEncryptedSlotValues({
        data_encryption_key: dek,
      });
    }

    // remove null valued slots
    encryptions = encryptions.filter(s => !!s.encrypted_value);

    const encryptedDek = await publicKey.encryptKey(dek);

    this.logger.log('Sending shared data');
    const shareResult = await this.vaultAPIFactory(credentials).SharesApi.itemsIdSharesPost(
      itemId,
      {
        shares: [
          {
            public_key: user_public_key,
            recipient_id: recipientId,
            keypair_external_id: user_keypair_external_id || undefined,
            ...shareOptions,
            slot_values: encryptions,
            encrypted_dek: encryptedDek,
          },
        ],
      }
    );
    return shareResult;
  }

  /**
   * @param shareType Filter by ShareType, either incoming or outgoing.
   * @param acceptanceStatus Filter by acceptance status. Other vaules are 'accepted', 'rejected'.
   */
  public async listShares(
    credentials: IVaultToken,
    shareType: ShareType = ShareType.Incoming,
    mustAccept?: AcceptanceRequest | string,
    options?: IPageOptions
  ): Promise<Share[]> {
    const api = this.vaultAPIFactory(credentials).SharesApi;

    let response: SharesIncomingResponse | SharesOutgoingResponse;
    switch (shareType) {
      case ShareType.Outgoing:
        response = await api.outgoingSharesGet(options?.nextPageAfter, options?.perPage);
        break;
      case ShareType.Incoming:
        response = await api.incomingSharesGet(
          options?.nextPageAfter,
          options?.perPage,
          mustAccept
        );
        break;
    }
    return response.shares;
  }

  public async listAll(
    credentials: IVaultToken,
    shareType: ShareType = ShareType.Incoming
  ): Promise<Share[]> {
    const api = this.vaultAPIFactory(credentials).SharesApi;
    const method = shareType === ShareType.Incoming ? api.incomingSharesGet : api.outgoingSharesGet;

    const result = await getAllPaged(cursor => method(cursor)).then(reducePages);
    return result.shares;
  }

  public async acceptIncomingShare(
    credentials: IVaultToken,
    shareId: string
  ): Promise<GetShareResponse> {
    try {
      return await this.vaultAPIFactory(credentials).SharesApi.incomingSharesIdAcceptPut(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  public async deleteSharedItem(credentials: IVaultToken, shareId: string) {
    try {
      return await this.vaultAPIFactory(credentials).SharesApi.sharesIdDelete(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  /**
   * Get a Share record and the Item it references with all Slots decrypted.
   * @param user
   * @param shareId
   * @param shareType Defaults to 'incoming'.
   */
  public async getSharedItem(
    credentials: IVaultToken & IKeystoreToken & IKEK & IDEK,
    shareId: string,
    shareType: ShareType = ShareType.Incoming
  ): Promise<{ share: Share; item: DecryptedItem }> {
    const shareAPI = this.vaultAPIFactory(credentials).SharesApi;

    let shareWithItemData: ShareWithItemData;
    if (shareType === ShareType.Incoming) {
      shareWithItemData = await shareAPI.incomingSharesIdItemGet(shareId).catch(err => {
        if ((<Response>err).status === 404) {
          throw new MeecoServiceError(
            `Share with id '${shareId}' not found for the specified user`
          );
        }
        throw err;
      });

      // assumes it is incoming share from here
      if (!hasAccepted(shareWithItemData.share.acceptance_required)) {
        // data is not decrypted as terms are not accepted
        throw new Error(
          `Share terms not accepted (${shareWithItemData.share.acceptance_required}); Item cannot be decrypted`
        );
      }

      // When Item is already shared with user using another share, retrieve that share and item as
      // there will be no share item created for requested share, only intent is created.
      if (shareWithItemData.item_shared_via_another_share_id) {
        shareWithItemData = await shareAPI.incomingSharesIdItemGet(
          shareWithItemData.item_shared_via_another_share_id
        );
        const str =
          'Item was already shared via another share \n' +
          `Item retrieved using existing shareId: ${shareWithItemData.share.id}`;
        this.logger.log(str);
      }

      this.logger.log('Getting share key');
      const dek = await new ItemService(this.environment, this.logger).getShareDEK(
        credentials,
        shareWithItemData.share
      );

      this.logger.log('Decrypting shared Item');
      return {
        ...shareWithItemData,
        item: await DecryptedItem.fromAPI({ data_encryption_key: dek }, shareWithItemData),
      };
    } else {
      // you own the object, but it is shared with someone
      // can decrypt immediately
      return shareAPI.outgoingSharesIdGet(shareId).then(async ({ share }) => {
        return {
          share,
          item: await new ItemService(this.environment).get(credentials, share.item_id),
        };
      });
    }
  }

  /**
   * Updates the shared copy of an item with new data in the actual item.
   * @param user
   * @param itemId
   */
  public async updateSharedItem(
    credentials: IVaultToken & IKeystoreToken & IKEK & IDEK,
    itemId: string
  ) {
    const item = await new ItemService(this.environment, this.logger).get(credentials, itemId);

    if (!item.isOwned()) {
      throw new MeecoServiceError(`Only Item owner can update shared Item.`);
    }

    this.logger.log('Retrieving Share Public Keys');
    // retrieve the list of shares IDs and public keys via
    const { shares } = await this.vaultAPIFactory(credentials).SharesApi.itemsIdSharesGet(itemId);

    // prepare request body

    // use the same DEK for all updates, it's the same data...
    const dek = SymmetricKey.generate();

    const result = await Promise.all(
      shares.map(async shareKey => {
        const sharePublicKey = new RSAPublicKey(shareKey.public_key!);
        const encryptedDek = await sharePublicKey.encryptKey(dek);

        const shareDek: ItemsIdSharesShareDeks = {
          share_id: shareKey.id,
          dek: encryptedDek,
        };

        this.logger.log('Re-Encrypt all slots');
        const slot_values = await item.toEncryptedSlotValues({
          data_encryption_key: dek,
        });

        // server create default slots for template
        const slot_values_with_template_default_slots = this.addMissingTemplateDefaultSlots(
          item.slots,
          slot_values
        );

        return {
          share_dek: shareDek,
          slot_values: slot_values_with_template_default_slots,
          share_id: shareKey.id,
        };
      })
    );

    const putItemSharesRequest: PutItemSharesRequest = {
      share_deks: [],
      slot_values: [],
      client_tasks: [],
    };

    result.map(r => {
      putItemSharesRequest.share_deks?.push(r.share_dek);
      r.slot_values.map(sv => {
        // TODO bug in API-SDK types
        (sv as any).encrypted_value = sv.encrypted_value === '' ? null : sv.encrypted_value;
        putItemSharesRequest.slot_values?.push({ ...sv, share_id: r.share_id });
      });
    });

    // put items/{id}/shares
    // TODO skip/alert if no shares
    return this.vaultAPIFactory(credentials)
      .SharesApi.itemsIdSharesPut(itemId, putItemSharesRequest)
      .catch(err => {
        if ((<Response>err).status === 400) {
          throw new Error('Error updating shares: ' + err.statusText);
        }

        throw err;
      });
  }

  private addMissingTemplateDefaultSlots(
    decryptedSlots: SDKDecryptedSlot[],
    slot_values: EncryptedSlotValue[]
  ) {
    decryptedSlots.forEach(ds => {
      if (!ds.value && !slot_values.find(f => f.slot_id === ds.id)) {
        slot_values.push({
          slot_id: ds.id as string,
          // TODO an API type bug prevents doing the right thing here
          // encrypted_value: '',
        } as any);
      }
    });

    return slot_values;
  }
}

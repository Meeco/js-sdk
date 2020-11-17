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
import { EncryptionKey } from '../models/encryption-key';
import { SDKDecryptedSlot, SlotHelpers } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import { getAllPaged, reducePages } from '../util/paged';
import { ConnectionService } from './connection-service';
import { ItemService } from './item-service';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

export enum SharingMode {
  owner = 'owner',
  anyone = 'anyone',
}

/** The result of an API call */
export enum AcceptanceStatus {
  required = 'acceptance_required',
  notRequired = 'acceptance_not_required',
  accepted = 'accepted',
  rejected = 'rejected ',
}

/** Values which can be set by the user */
export enum AcceptanceRequest {
  required = 'acceptance_required',
  notRequired = 'acceptance_not_required',
}

function hasAccepted(status: string) {
  return status === AcceptanceStatus.accepted || status === AcceptanceStatus.notRequired;
}

interface IShareOptions {
  slot_id?: string;
  expires_at?: Date;
  terms?: string;
  sharing_mode?: SharingMode;
  acceptance_required?: AcceptanceRequest;
}

export enum ShareType {
  incoming = 'incoming',
  outgoing = 'outgoing',
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
    return this.vaultAPIFactory(token.vault_access_token).SharesApi;
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
    const { vault_access_token } = credentials;

    const fromUserConnection = await new ConnectionService(this.environment, this.logger).get(
      credentials,
      connectionId
    );
    const {
      user_public_key,
      user_keypair_external_id,
      user_id: recipientId,
    } = fromUserConnection.the_other_user;

    this.logger.log('Preparing item to share');
    const item = await new ItemService(this.environment).get(credentials, itemId);
    const { slots } = item;

    this.logger.log('Encrypting slots with generated DEK');
    const dek = EncryptionKey.fromRaw(Service.cryppo.generateRandomKey());

    let encryptions: EncryptedSlotValue[];
    if (shareOptions.slot_id) {
      const shareSlot = slots.find(slot => slot.id === shareOptions.slot_id);
      if (!shareSlot) {
        throw new Error(`could not find slot with id ${shareOptions.slot_id}`);
      }
      encryptions = [await SlotHelpers.toEncryptedSlotValue(credentials, shareSlot)];
    } else {
      encryptions = await item.toEncryptedSlotValues({
        data_encryption_key: dek,
      });
    }

    const encryptedDek = await Service.cryppo.encryptWithPublicKey({
      publicKeyPem: user_public_key,
      data: dek.key,
    });

    this.logger.log('Sending shared data');
    const shareResult = await this.vaultAPIFactory(vault_access_token).SharesApi.itemsIdSharesPost(
      itemId,
      {
        shares: [
          {
            public_key: user_public_key,
            recipient_id: recipientId,
            keypair_external_id: user_keypair_external_id || undefined,
            ...shareOptions,
            slot_values: encryptions,
            encrypted_dek: encryptedDek.serialized,
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
    user: IVaultToken,
    shareType: ShareType = ShareType.incoming,
    mustAccept?: AcceptanceRequest | string,
    options?: IPageOptions
  ): Promise<Share[]> {
    const api = this.vaultAPIFactory(user.vault_access_token).SharesApi;

    let response: SharesIncomingResponse | SharesOutgoingResponse;
    switch (shareType) {
      case ShareType.outgoing:
        response = await api.outgoingSharesGet(options?.nextPageAfter, options?.perPage);
        break;
      case ShareType.incoming:
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
    user: IVaultToken,
    shareType: ShareType = ShareType.incoming
  ): Promise<Share[]> {
    const api = this.vaultAPIFactory(user.vault_access_token).SharesApi;
    const method = shareType === ShareType.incoming ? api.incomingSharesGet : api.outgoingSharesGet;

    const result = await getAllPaged(cursor => method(cursor)).then(reducePages);
    return result.shares;
  }

  public async acceptIncomingShare(user: IVaultToken, shareId: string): Promise<GetShareResponse> {
    try {
      return await this.vaultAPIFactory(
        user.vault_access_token
      ).SharesApi.incomingSharesIdAcceptPut(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  public async deleteSharedItem(user: IVaultToken, shareId: string) {
    try {
      return await this.vaultAPIFactory(user.vault_access_token).SharesApi.sharesIdDelete(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  /**
   * A shared Item may be either encrypted with a shared data-encryption key (DEK) or with
   * the user's personal DEK. This method inspects the share record and returns the appropriate
   * key.
   * @param user
   * @param shareId
   */
  public async getShareDEK(
    credentials: IKeystoreToken & IKEK & IDEK,
    share: Share
  ): Promise<EncryptionKey> {
    let dataEncryptionKey: EncryptionKey;

    if (share.encrypted_dek) {
      const { keypair } = await this.keystoreAPIFactory(
        credentials.keystore_access_token
      ).KeypairApi.keypairsIdGet(share.keypair_external_id!);

      const decryptedPrivateKey = await Service.cryppo.decryptWithKey({
        serialized: keypair.encrypted_serialized_key,
        key: credentials.key_encryption_key.key,
      });

      dataEncryptionKey = await Service.cryppo
        .decryptSerializedWithPrivateKey({
          privateKeyPem: decryptedPrivateKey,
          serialized: share.encrypted_dek,
        })
        .then(EncryptionKey.fromRaw);
    } else {
      dataEncryptionKey = credentials.data_encryption_key;
    }

    return dataEncryptionKey;
  }

  /**
   * Get a Share record and the Item it references with all Slots decrypted.
   * @param user
   * @param shareId
   * @param shareType Defaults to 'incoming'.
   */
  public async getSharedItem(
    user: IVaultToken & IKeystoreToken & IKEK & IDEK,
    shareId: string,
    shareType: ShareType = ShareType.incoming
  ): Promise<{ share: Share; item: DecryptedItem }> {
    const shareAPI = this.vaultAPIFactory(user.vault_access_token).SharesApi;

    let shareWithItemData: ShareWithItemData;
    if (shareType === ShareType.incoming) {
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
      const dek = await this.getShareDEK(user, shareWithItemData.share);

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
          item: await new ItemService(this.environment).get(user, share.item_id),
        };
      });
    }
  }

  /**
   * Updates the shared copy of an item with new data in the actual item.
   * @param user
   * @param itemId
   */
  public async updateSharedItem(user: IVaultToken & IKeystoreToken & IKEK & IDEK, itemId: string) {
    const item = await new ItemService(this.environment, this.logger).get(user, itemId);

    if (!item.isOwned()) {
      throw new MeecoServiceError(`Only Item owner can update shared Item.`);
    }

    this.logger.log('Retrieving Share Public Keys');
    // retrieve the list of shares IDs and public keys via
    const { shares } = await this.vaultAPIFactory(
      user.vault_access_token
    ).SharesApi.itemsIdSharesGet(itemId);

    // prepare request body

    // use the same DEK for all updates, it's the same data...
    const dek = Service.cryppo.generateRandomKey();

    const result = await Promise.all(
      shares.map(async shareKey => {
        const encryptedDek = await Service.cryppo.encryptWithPublicKey({
          publicKeyPem: shareKey.public_key,
          data: dek,
        });

        const shareDek: ItemsIdSharesShareDeks = {
          share_id: shareKey.id,
          dek: encryptedDek.serialized,
        };

        this.logger.log('Re-Encrypt all slots');
        const slot_values = await item.toEncryptedSlotValues({
          data_encryption_key: EncryptionKey.fromRaw(dek),
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
    return this.vaultAPIFactory(user.vault_access_token)
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

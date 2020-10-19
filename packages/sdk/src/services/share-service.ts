import {
  EncryptedSlotValue,
  GetItemSharesResponseShares,
  GetShareResponse,
  ItemsIdSharesShareDeks,
  PostItemSharesRequestShare,
  PutItemSharesRequest,
  SharesApi,
  SharesCreateResponse,
  SharesIncomingResponse,
  SharesOutgoingResponse,
  ShareWithItemData,
  Slot,
} from '@meeco/vault-api-sdk';
import { DecryptedSlot } from '..';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { IDecryptedSlot } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import { fetchConnectionWithId } from '../util/find-connection-between';
import { VALUE_VERIFICATION_KEY_LENGTH, valueVerificationHash } from '../util/value-verification';
import cryppo from './cryppo-service';
import { ItemService } from './item-service';
import Service from './service';

export enum SharingMode {
  owner = 'owner',
  anyone = 'anyone',
}

/** The API may return accepted or rejected, but those are set via their own API calls. */
export enum AcceptanceStatus {
  required = 'acceptance_required',
  notRequired = 'acceptance_not_required',
}

interface IShareOptions extends PostItemSharesRequestShare {
  expires_at?: Date;
  terms?: string;
  sharing_mode: SharingMode;
  acceptance_required: AcceptanceStatus;
}

export interface IShareIncomingOutGoingReponse
  extends SharesOutgoingResponse,
    SharesIncomingResponse {}

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

  // for mocking during testing
  private static valueVerificationHash =
    (<any>global).valueVerificationHash || valueVerificationHash;

  public getAPI(vaultToken: string) {
    return this.vaultAPIFactory(vaultToken).SharesApi;
  }

  public async shareItem(
    fromUser: AuthData,
    connectionId: string,
    itemId: string,
    shareOptions: IShareOptions
  ): Promise<SharesCreateResponse> {
    this.logger.log('Fetching connection');
    const fromUserConnection = await fetchConnectionWithId(
      fromUser,
      connectionId,
      this.environment,
      this.logger.log
    );

    this.logger.log('Preparing item to share');
    const share = await this.shareItemFromVaultItem(fromUser, itemId, {
      ...shareOptions,
      recipient_id: fromUserConnection.the_other_user.user_id,
      public_key: fromUserConnection.the_other_user.user_public_key,
      keypair_external_id: fromUserConnection.the_other_user.user_keypair_external_id!,
    });

    this.logger.log('Sending shared data');
    const shareResult = await this.getAPI(fromUser.vault_access_token).itemsIdSharesPost(itemId, {
      shares: [share],
    });
    return shareResult;
  }

  public async listShares(
    user: AuthData,
    shareType: ShareType = ShareType.incoming
  ): Promise<IShareIncomingOutGoingReponse> {
    switch (shareType) {
      case ShareType.outgoing:
        return await this.getAPI(user.vault_access_token).outgoingSharesGet();
      case ShareType.incoming:
        return await this.getAPI(user.vault_access_token).incomingSharesGet();
    }
  }

  public async acceptIncomingShare(user: AuthData, shareId: string): Promise<GetShareResponse> {
    try {
      return await this.getAPI(user.vault_access_token).incomingSharesIdAcceptPut(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  public async deleteSharedItem(user: AuthData, shareId: string) {
    try {
      await this.getAPI(user.vault_access_token).sharesIdDelete(shareId);
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
   * @param shareType
   */
  public async getSharedItem(
    user: AuthData,
    shareId: string,
    shareType: ShareType = ShareType.incoming
  ): Promise<ShareWithItemData> {
    const shareAPI = this.getAPI(user.vault_access_token);

    let shareWithItemData: ShareWithItemData;

    switch (shareType) {
      case ShareType.incoming:
        shareWithItemData = await shareAPI.incomingSharesIdItemGet(shareId).catch(err => {
          if ((<Response>err).status === 404) {
            throw new MeecoServiceError(
              `Share with id '${shareId}' not found for the specified user`
            );
          }
          throw err;
        });

        break;
      case ShareType.outgoing:
        shareWithItemData = await shareAPI.outgoingSharesIdGet(shareId).then(async response => {
          const share = response.share;
          const item = await this.getItem(user, share.item_id);
          return {
            share,
            ...item,
          };
        });
        break;
    }

    // assumes it is incoming share from here
    if (shareWithItemData.share.acceptance_required === AcceptanceStatus.required) {
      return shareWithItemData;
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

    // TODO assumes it is still encrypted with the share DEK, not the user's DEK
    const keyPairExternal = await this.keystoreAPIFactory(user).KeypairApi.keypairsIdGet(
      shareWithItemData.share.keypair_external_id!
    );

    const decryptedPrivateKey = await Service.cryppo.decryptWithKey({
      serialized: keyPairExternal.keypair.encrypted_serialized_key,
      key: user.key_encryption_key.key,
    });

    const dek = await Service.cryppo
      .decryptSerializedWithPrivateKey({
        privateKeyPem: decryptedPrivateKey,
        serialized: shareWithItemData.share.encrypted_dek,
      })
      .then(key => EncryptionKey.fromRaw(key));

    const decryptedSlots = await Promise.all(
      shareWithItemData.slots.map(s => ItemService.decryptSlot(s, dek))
    );

    return {
      ...shareWithItemData,
      slots: decryptedSlots as Slot[],
    };
  }

  public async getSharedItemIncoming(user: AuthData, shareId: string): Promise<ShareWithItemData> {
    return this.getSharedItem(user, shareId, ShareType.incoming);
  }

  private async shareItemFromVaultItem(
    fromUser: AuthData,
    itemId: string,
    shareOptions: PostItemSharesRequestShare
  ): Promise<PostItemSharesRequestShare> {
    const item = await this.getItem(fromUser, itemId);

    let sharedItem: any = null;
    if (item.item && item.item.share_id != null) {
      sharedItem = await this.getSharedItemIncoming(fromUser, item.item.share_id);
    }

    let { slots } = sharedItem || item;

    if (shareOptions.slot_id) {
      slots = slots.filter((slot: Slot) => slot.id === shareOptions.slot_id);
    }

    // we only need to decrypt slots if, item owner sharing item. otherwise, slots are already decrypted
    this.logger.log('Decrypting all slots');
    const decryptedSlots = sharedItem
      ? slots
      : await Promise.all(
          slots!.map(s => ItemService.decryptSlot(s, fromUser.data_encryption_key))
        );
    this.logger.log('Encrypting slots with generate DEK');
    const dek = Service.cryppo.generateRandomKey();

    const slot_values = await this.convertSlotsToEncryptedValuesForShare(
      decryptedSlots,
      EncryptionKey.fromRaw(dek)
    );

    const encryptedDek = await Service.cryppo.encryptWithPublicKey({
      publicKeyPem: shareOptions.public_key,
      data: dek,
    });

    return {
      ...shareOptions,
      slot_values,
      encrypted_dek: encryptedDek.serialized,
    };
  }

  private async getItem(fromUser: AuthData, itemId: string) {
    const item = await this.vaultAPIFactory(fromUser).ItemApi.itemsIdGet(itemId);

    if (!item) {
      throw new MeecoServiceError(`Item '${itemId}' not found`);
    }
    return item;
  }

  /**
   * Updates the shared copy of an item with new data in the actual item.
   * @param user
   * @param itemId
   */
  public async updateSharedItem(user: AuthData, itemId: string) {
    const { item, slots: decryptedSlots } = await new ItemService(
      this.environment,
      this.logger
    ).get(itemId, user);

    if (!item.own) {
      throw new MeecoServiceError(`Only Item owner can update shared Item.`);
    }

    this.logger.log('Retrieving Share Public Keys');
    const itemShares = await this.vaultAPIFactory(
      user.vault_access_token
    ).SharesApi.itemsIdSharesGet(itemId);

    // prepare request body
    const putItemSharesRequest = await this.createPutItemSharesRequestBody(
      itemShares.shares,
      decryptedSlots
    );

    return this.vaultAPIFactory(user.vault_access_token)
      .SharesApi.itemsIdSharesPut(itemId, putItemSharesRequest)
      .catch(err => {
        if ((<Response>err).status === 400) {
          throw new Error('Error updating shares: ' + err.statusText);
        }

        throw err;
      });
  }

  private async createPutItemSharesRequestBody(
    shares: GetItemSharesResponseShares[],
    decryptedSlots: IDecryptedSlot[]
  ): Promise<PutItemSharesRequest> {
    const result: any = await Promise.all(
      shares.map(async share => {
        this.logger.log('Encrypting slots with generated DEK');
        const dek = Service.cryppo.generateRandomKey();

        const encryptedDek = await Service.cryppo.encryptWithPublicKey({
          publicKeyPem: share.public_key,
          data: dek,
        });

        const shareDek: ItemsIdSharesShareDeks = {
          share_id: share.id,
          dek: encryptedDek.serialized,
        };

        this.logger.log('Re-Encrypt all slots');
        const slot_values = await this.convertSlotsToEncryptedValuesForShare(
          decryptedSlots,
          EncryptionKey.fromRaw(dek)
        );

        // server create default slots for template
        const slot_values_with_template_default_slots = this.addMissingTemplateDefaultSlots(
          decryptedSlots,
          slot_values
        );

        return {
          share_dek: shareDek,
          slot_values: slot_values_with_template_default_slots,
          share_id: share.id,
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
        sv.encrypted_value = sv.encrypted_value === '' ? null : sv.encrypted_value;
        putItemSharesRequest.slot_values?.push({ ...sv, share_id: r.share_id });
      });
    });

    return putItemSharesRequest;
  }

  private addMissingTemplateDefaultSlots(
    decryptedSlots: DecryptedSlot[],
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

  /**
   * In the API: a share expects an `encrypted_value` property.
   * For a tile item - this is a stringified json payload of key/value
   * pairs where the key is the slot id and the value is the slot value
   * encrypted with a shared data encryption key.
   */
  public async convertSlotsToEncryptedValuesForShare(
    slots: IDecryptedSlot[],
    sharedDataEncryptionKey: EncryptionKey
  ): Promise<EncryptedSlotValue[]> {
    const encryptions = slots
      .filter(slot => slot.value && slot.id)
      .map(async slot => {
        const encrypted_value = await Service.cryppo
          .encryptWithKey({
            data: slot.value as string,
            key: sharedDataEncryptionKey.key,
            strategy: Service.cryppo.CipherStrategy.AES_GCM,
          })
          .then(result => result.serialized);

        const valueVerificationKey = slot.own
          ? cryppo.generateRandomKey(VALUE_VERIFICATION_KEY_LENGTH)
          : slot.value_verification_key;

        const encryptedValueVerificationKey = await Service.cryppo
          .encryptWithKey({
            data: valueVerificationKey as string,
            key: sharedDataEncryptionKey.key,
            strategy: Service.cryppo.CipherStrategy.AES_GCM,
          })
          .then(result => result.serialized);

        // this will be replace by cryppo call later
        const verificationHash = slot.own
          ? ShareService.valueVerificationHash(valueVerificationKey as string, slot.value as string)
          : undefined;

        return {
          slot_id: slot.id as string,
          encrypted_value: encrypted_value as string,
          encrypted_value_verification_key: encryptedValueVerificationKey || undefined,
          value_verification_hash: verificationHash,
        };
      });
    return Promise.all(encryptions);
  }
}

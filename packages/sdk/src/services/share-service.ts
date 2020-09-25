import { hmacSha256Digest } from '@meeco/cryppo/dist/src/digests/hmac-digest';
import {
  EncryptedSlotValue,
  GetItemSharesResponse,
  GetShareResponse,
  ItemsIdSharesShareDeks,
  PostItemSharesRequestShare,
  PutItemSharesRequest,
  SharesResponse,
  ShareWithItemData,
  Slot,
} from '@meeco/vault-api-sdk';
import { DecryptedSlot } from '..';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { MeecoServiceError } from '../models/service-error';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  vaultAPIFactory,
  VaultAPIFactory,
} from '../util/api-factory';
import { fetchConnectionWithId } from '../util/find-connection-between';
import { noopLogger, SimpleLogger } from '../util/logger';
import cryppo from './cryppo-service';
import { ItemService } from './item-service';

interface IShareOptions extends PostItemSharesRequestShare {
  expires_at?: Date;
  terms?: string;
  sharing_mode: string;
  acceptance_required: string;
}

export enum ShareType {
  incoming = 'incoming',
  outgoing = 'outgoing',
}

/**
 * Service for sharing data between two connected Meeco users.
 * Connections can be setup via the {@link ConnectionService}
 */
export class ShareService {
  constructor(private environment: Environment, private log: SimpleLogger = noopLogger) {
    this.keystoreApiFactory = keystoreAPIFactory(environment);
    this.vaultApiFactory = vaultAPIFactory(environment);
  }
  /**
   * @visibleForTesting
   * @ignore
   */
  static Date = global.Date;

  // for mocking during testing
  private cryppo = (<any>global).cryppo || cryppo;
  private keystoreApiFactory: KeystoreAPIFactory;
  private vaultApiFactory: VaultAPIFactory;

  static generate_value_verificaiton_hash(value_verification_key: string, slot_value: string) {
    return hmacSha256Digest(value_verification_key, slot_value);
  }

  public setLogger(logger: SimpleLogger) {
    this.log = logger;
  }

  public async shareItem(
    fromUser: AuthData,
    connectionId: string,
    itemId: string,
    shareOptions: IShareOptions
  ): Promise<SharesResponse> {
    this.log('Fetching connection');
    const fromUserConnection = await fetchConnectionWithId(
      fromUser,
      connectionId,
      this.environment,
      this.log
    );

    this.log('Preparing item to share');
    const share = await this.shareItemFromVaultItem(fromUser, itemId, {
      ...shareOptions,
      recipient_id: fromUserConnection.the_other_user.user_id,
      public_key: fromUserConnection.the_other_user.user_public_key,
      keypair_external_id: fromUserConnection.the_other_user.user_keypair_external_id!,
    });

    this.log('Sending shared data');
    const shareResult = await this.vaultApiFactory(fromUser).SharesApi.itemsIdSharesPost(itemId, {
      shares: [share],
    });
    return shareResult;
  }

  public async listShares(
    user: AuthData,
    shareType: ShareType = ShareType.incoming
  ): Promise<SharesResponse> {
    switch (shareType) {
      case ShareType.outgoing:
        return await this.vaultApiFactory(user).SharesApi.outgoingSharesGet();
      case ShareType.incoming:
        return await this.vaultApiFactory(user).SharesApi.incomingSharesGet();
    }
  }

  public async acceptIncomingShare(user: AuthData, shareId: string): Promise<GetShareResponse> {
    try {
      return await this.vaultApiFactory(user).SharesApi.incomingSharesIdAcceptPut(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  public async deleteSharedItem(user: AuthData, shareId: string) {
    try {
      await this.vaultApiFactory(user).SharesApi.sharesIdDelete(shareId);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`Share with id '${shareId}' not found for the specified user`);
      }
      throw error;
    }
  }

  public async getSharedItemIncoming(user: AuthData, shareId: string): Promise<ShareWithItemData> {
    const shareWithItemData = await this.vaultApiFactory(user)
      .SharesApi.incomingSharesIdItemGet(shareId)
      .catch(err => {
        if ((<Response>err).status === 404) {
          throw new MeecoServiceError(
            `Share with id '${shareId}' not found for the specified user`
          );
        }
        throw err;
      });

    if (shareWithItemData.share.acceptance_required === 'acceptance_required') {
      return shareWithItemData;
    }

    const keyPairExternal = await this.keystoreApiFactory(user).KeypairApi.keypairsIdGet(
      shareWithItemData.share.keypair_external_id!
    );

    const decryptedPrivateKey = await this.cryppo.decryptWithKey({
      serialized: keyPairExternal.keypair.encrypted_serialized_key,
      key: user.key_encryption_key.key,
    });

    const dek = await this.cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: decryptedPrivateKey,
      serialized: shareWithItemData.share.encrypted_dek,
    });

    const key = EncryptionKey.fromRaw(dek);

    const decryptedSlots = await ItemService.decryptAllSlots(shareWithItemData.slots, key);

    return {
      ...shareWithItemData,
      slots: decryptedSlots as Slot[],
    };
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
    this.log('Decrypting all slots');
    const decryptedSlots = sharedItem
      ? slots
      : await ItemService.decryptAllSlots(slots!, fromUser.data_encryption_key);

    this.log('Encrypting slots with generate DEK');
    const dek = this.cryppo.generateRandomKey();

    const slot_values = await this.convertSlotsToEncryptedValuesForShare(
      decryptedSlots,
      EncryptionKey.fromRaw(dek)
    );

    const encryptedDek = await this.cryppo.encryptWithPublicKey({
      publicKeyPem: shareOptions.public_key,
      data: dek,
    });

    // in case of on-share, API requires hash to be null
    if (sharedItem) {
      slot_values.forEach(slot_value => (slot_value.value_verification_hash = undefined));
    }

    return {
      ...shareOptions,
      slot_values,
      encrypted_dek: encryptedDek.serialized,
    };
  }

  private async getItem(fromUser: AuthData, itemId: string) {
    const item = await this.vaultApiFactory(fromUser).ItemApi.itemsIdGet(itemId);

    if (!item) {
      throw new MeecoServiceError(`Item '${itemId}' not found`);
    }
    return item;
  }

  public async updateSharedItem(user: AuthData, itemId: string) {
    const { item, slots } = await this.getItem(user, itemId);
    if (item.own === false) {
      throw new MeecoServiceError(`Only Item owner can update shared Item.`);
    }

    // retrieve the list of shares IDs and public keys via
    const itemShares = await this.vaultApiFactory(user).SharesApi.itemsIdSharesGet(itemId);

    // prepare request body
    const putItemSharesRequest = await this.createPutItemSharesRequestBody(itemShares, slots, user);

    // put items/{id}/shares
    return await this.vaultApiFactory(user).SharesApi.itemsIdSharesPut(
      itemId,
      putItemSharesRequest
    );
  }

  private async createPutItemSharesRequestBody(
    itemShares: GetItemSharesResponse,
    slots: Slot[],
    user: AuthData
  ): Promise<PutItemSharesRequest> {
    const result: any = await Promise.all(
      itemShares.shares.map(async share => {
        this.log('Encrypting slots with generate DEK');
        const dek = this.cryppo.generateRandomKey();

        const encryptedDek = await this.cryppo.encryptWithPublicKey({
          publicKeyPem: share.public_key,
          data: dek,
        });

        const shareDek: ItemsIdSharesShareDeks = {
          share_id: share.id,
          dek: encryptedDek.serialized,
        };

        this.log('Decrypting all slots');
        const decryptedSlots = await ItemService.decryptAllSlots(slots!, user.data_encryption_key);

        this.log('Re-Encrypt all slots');
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
          encrypted_value: '',
        });
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
    slots: DecryptedSlot[],
    sharedDataEncryptionKey: EncryptionKey
  ): Promise<EncryptedSlotValue[]> {
    const encryptions = slots
      .filter(slot => slot.value && slot.id)
      .map(async slot => {
        const encrypted_value = await cryppo
          .encryptWithKey({
            data: slot.value as string,
            key: sharedDataEncryptionKey.key,
            strategy: this.cryppo.CipherStrategy.AES_GCM,
          })
          .then(result => result.serialized);

        const value_verification_key = cryppo.generateRandomKey(64);
        const encrypted_value_verification_key = await cryppo
          .encryptWithKey({
            data: value_verification_key,
            key: sharedDataEncryptionKey.key,
            strategy: this.cryppo.CipherStrategy.AES_GCM,
          })
          .then(result => result.serialized);

        // this will be replace by cryppo call later
        const value_verification_hash = ShareService.generate_value_verificaiton_hash(
          value_verification_key,
          slot.value as string
        );

        return {
          slot_id: slot.id as string,
          encrypted_value: encrypted_value as string,
          encrypted_value_verification_key: encrypted_value_verification_key || undefined,
          value_verification_hash,
        };
      });
    return Promise.all(encryptions);
  }
}

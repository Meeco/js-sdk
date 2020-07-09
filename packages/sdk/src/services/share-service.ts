import { Connection, PostSharesEncryptedValues } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { EncryptionSpaceData } from '../models/encryption-space-data';
import { Environment } from '../models/environment';
import { DecryptedSlot } from '../models/local-slot';
import { MeecoServiceError } from '../models/service-error';
import {
  KeystoreAPIFactory,
  keystoreAPIFactory,
  vaultAPIFactory,
  VaultAPIFactory
} from '../util/api-factory';
import { fetchConnectionWithId } from '../util/find-connection-between';
import cryppo from './cryppo-service';
import { ItemService } from './item-service';

interface ISharedEncryptionSpace {
  from_user_connection_id: string;
  to_user_connection_id?: string;
  shared_data_encryption_key?: EncryptionKey;
}

interface IShareOptions {
  expires_at?: Date;
  terms?: string;
  note?: string;
  distributable?: boolean;
  tradeable?: boolean;
}

/**
 * Service for sharing data between two connected Meeco users.
 * Connections can be setup via the {@link ConnectionService}
 */
export class ShareService {
  /**
   * @visibleForTesting
   * @ignore
   */
  static Date = global.Date;

  // for mocking during testing
  private cryppo = (<any>global).cryppo || cryppo;
  private keystoreApiFactory: KeystoreAPIFactory;
  private vaultApiFactory: VaultAPIFactory;

  constructor(private environment: Environment, private log: (message: string) => void = () => {}) {
    this.keystoreApiFactory = keystoreAPIFactory(environment);
    this.vaultApiFactory = vaultAPIFactory(environment);
  }

  public async shareItem(
    fromUser: AuthData,
    connectionId: string,
    itemId: string,
    shareOptions: IShareOptions = {}
  ) {
    const fromUserConnection = await fetchConnectionWithId(
      fromUser,
      connectionId,
      this.environment,
      this.log
    );

    this.log('Fetching shared encryption space');
    const sharedEncryptionSpace = await this.fetchSharedEncryptionSpace(
      fromUser,
      fromUserConnection
    );

    const share = await this.shareItemFromVaultItem(
      fromUser,
      fromUserConnection,
      sharedEncryptionSpace,
      itemId,
      fromUserConnection.user_id,
      shareOptions
    );

    this.log('Sending shared data');
    const shareResult = await this.vaultApiFactory(fromUser).SharesApi.sharesPost({
      shares: [share]
    });
    return {
      ...share,
      share: shareResult
    };
  }

  public async listShares(user: AuthData) {
    return await this.vaultApiFactory(user).SharesApi.sharesIncomingGet();
  }

  public async deleteSharedItem(user: AuthData, shareId: string) {
    await this.vaultApiFactory(user)
      .SharesApi.sharesIdDelete(shareId)
      .catch(err => {
        if ((<Response>err).status === 404) {
          throw new MeecoServiceError(
            `Share with id '${shareId}' not found for the specified user`
          );
        }
        throw err;
      });

    this.log('Share successfully deleted');
  }

  public async getSharedItem(user: AuthData, shareId: string) {
    const result = await this.vaultApiFactory(user)
      .SharesApi.sharesIdGet(shareId)
      .catch(err => {
        if ((<Response>err).status === 404) {
          throw new MeecoServiceError(
            `Share with id '${shareId}' not found for the specified user`
          );
        }
        throw err;
      });
    const { item, share } = result;

    const connection = await this.ensureClaimedKey(user, share.connection_id);

    const slots = result.slots;
    const space = await this.keystoreApiFactory(user).EncryptionSpaceApi.encryptionSpacesIdGet(
      connection.encryption_space_id!
    );
    const decryptedSharedDataEncryptionKey = await this.cryppo.decryptWithKey({
      serialized: space.encryption_space_data_encryption_key.serialized_data_encryption_key,
      key: user.key_encryption_key.key
    });
    const key = EncryptionKey.fromRaw(decryptedSharedDataEncryptionKey);
    const decryptedSlots = await ItemService.decryptAllSlots(slots!, key);

    return {
      item,
      slots: decryptedSlots,
      share,
      connection
    };
  }

  private async shareItemFromVaultItem(
    fromUser: AuthData,
    connection: Connection,
    sharedEncryptionSpace: ISharedEncryptionSpace,
    itemId: string,
    toUserId: string,
    shareOptions: IShareOptions
  ) {
    const item = await this.vaultApiFactory(fromUser).ItemApi.itemsIdGet(itemId);

    if (!item) {
      throw new MeecoServiceError(`Item '${itemId}' not found`);
    }
    const { slots } = item;

    if (!sharedEncryptionSpace.shared_data_encryption_key) {
      this.log('No encryption space found - creating one');
      const encryptonSpace = await this.createSharedEncryptionSpace(fromUser, connection);
      sharedEncryptionSpace = {
        from_user_connection_id: connection.id,
        shared_data_encryption_key: EncryptionKey.fromRaw(encryptonSpace.dataEncryptionKey)
      };
    }

    this.log('Decrypting all slots');
    const decryptedSlots = await ItemService.decryptAllSlots(slots!, fromUser.data_encryption_key);
    this.log('Encrypting slots with shared key');
    const encrypted_values = await this.convertSlotsToEncryptedValuesForShare(
      decryptedSlots,
      sharedEncryptionSpace.shared_data_encryption_key!
    );
    return {
      ...shareOptions,
      shareable_id: itemId,
      shareable_type: 'Item',
      encrypted_values,
      distributable: false,
      outgoing: true,
      // TODO - this should be the connection id but API does not support it yet
      user_id: toUserId
    };
  }

  public async fetchSharedEncryptionSpace(
    user: AuthData,
    connection: Connection
  ): Promise<ISharedEncryptionSpace> {
    if (!connection.encryption_space_id) {
      // Users have no shared encryption space
      return new EncryptionSpaceData({
        from_user_connection_id: connection.id
      });
    }

    this.log('Fetching shared encryption key');
    const sharedDataEncryptionKey = await this.keystoreApiFactory(
      user
    ).EncryptionSpaceApi.encryptionSpacesIdGet(connection.encryption_space_id);

    const decryptedSharedDataEncryptionKey = await this.cryppo.decryptWithKey({
      serialized: sharedDataEncryptionKey.encryption_space_data_encryption_key
        ?.serialized_data_encryption_key!,
      key: user.key_encryption_key.key
    });

    return new EncryptionSpaceData({
      from_user_connection_id: connection.id,
      shared_data_encryption_key: EncryptionKey.fromRaw(decryptedSharedDataEncryptionKey)
    });
  }

  private async createSharedEncryptionSpace(fromUser: AuthData, connection: Connection) {
    this.log('Generating from user data encryption key');
    const fromUserEncryptionSpace = await this.createAndStoreNewDataEncryptionKey(fromUser);
    const encryptionSpaceId = fromUserEncryptionSpace.encryptionSpace?.encryption_space_id!;

    const recipientPublicKey = connection.other_user_connection_public_key;
    if (!recipientPublicKey) {
      throw new MeecoServiceError('Other user public key missing!');
    }

    const shareableDataEncryptionKey = await this.cryppo.encryptWithPublicKey({
      data: fromUserEncryptionSpace.dataEncryptionKey,
      publicKeyPem: recipientPublicKey
    });

    this.log('Updating connection encryption space');
    await this.vaultApiFactory(fromUser).ConnectionApi.connectionsConnectionIdEncryptionSpacePost(
      connection.id!,
      {
        encryption_space_id: encryptionSpaceId
      }
    );

    this.log('Sending shared key');
    const sharedKey = await this.keystoreApiFactory(fromUser).SharedKeyApi.sharedKeysPost({
      encrypted_key: shareableDataEncryptionKey.serialized,
      external_id: encryptionSpaceId,
      public_key: recipientPublicKey,
      key_metadata: {
        key_type: this.cryppo.CipherStrategy.AES_GCM
      }
    });
    return {
      connection,
      dataEncryptionKey: fromUserEncryptionSpace.dataEncryptionKey,
      fromUserSharedKey: sharedKey.shared_key
    };
  }

  private async ensureClaimedKey(user: AuthData, connectionId: string) {
    const connection = await fetchConnectionWithId(user, connectionId, this.environment, this.log);
    if (!connection.encryption_space_id) {
      this.log('Shared data encryption key not yet claimed - claiming');
      return this.claimSharedEncryptionSpace(user, connection);
    }

    return connection;
  }

  private async claimSharedEncryptionSpace(toUser: AuthData, connection: Connection) {
    const encryptionSpaceId = connection.other_user_connection_encryption_space_id!;
    this.log('Fetching key pair');
    const keyPair = await this.keystoreApiFactory(toUser)
      .KeypairApi.keypairsIdGet(connection.keypair_external_id)
      .then(res => res.keypair);

    const privateKey = await this.cryppo.decryptWithKey({
      serialized: keyPair.encrypted_serialized_key,
      key: toUser.key_encryption_key.key
    });
    this.log('Claiming data encryption key');
    const reEncryptedDataEncryptionKey = await this.claimAndReEncryptSharedDataEncryptionKey(
      toUser,
      encryptionSpaceId,
      {
        publicKey: keyPair.public_key,
        privateKey
      }
    );

    this.log('Creating new encryption space with re-encrypted claimed key');
    const encryptionSpace = await this.keystoreApiFactory(
      toUser
    ).EncryptionSpaceApi.encryptionSpacesPost({
      encrypted_serialized_key: reEncryptedDataEncryptionKey.serialized
    });
    const { encryption_space_id } = encryptionSpace.encryption_space_data_encryption_key!;

    this.log('Updating shared encryption space');
    await this.vaultApiFactory(toUser).ConnectionApi.connectionsConnectionIdEncryptionSpacePost(
      connection.id,
      {
        encryption_space_id
      }
    );

    connection.encryption_space_id = encryption_space_id;

    return connection;
  }

  private async createAndStoreNewDataEncryptionKey(user: AuthData) {
    const dataEncryptionKey = this.cryppo.generateRandomKey();
    const encryptedDataEncryptionKey = await this.cryppo.encryptWithKey({
      data: dataEncryptionKey,
      key: user.key_encryption_key.key,
      strategy: this.cryppo.CipherStrategy.AES_GCM
    });
    const encryptionSpace = await this.keystoreApiFactory(user)
      .EncryptionSpaceApi.encryptionSpacesPost({
        encrypted_serialized_key: encryptedDataEncryptionKey.serialized
      })
      .then(result => result.encryption_space_data_encryption_key);

    return {
      dataEncryptionKey,
      encryptionSpace
    };
  }

  private async claimAndReEncryptSharedDataEncryptionKey(
    user: AuthData,
    encryptionSpaceId: string,
    keyPair: {
      privateKey: string;
      publicKey: string;
    }
  ) {
    const signature = await this.buildClaimKeySignature(encryptionSpaceId, keyPair.privateKey);
    const claimedKey = await this.keystoreApiFactory(user)
      .SharedKeyApi.sharedKeysExternalIdClaimKeyPost(encryptionSpaceId, {
        public_key: keyPair.publicKey,
        request_signature: signature.serialized
      })
      .catch(async err => {
        if (err?.status === 403 && typeof err?.json === 'function') {
          const json = await err.json();
          if (json?.errors[0].error === 'invalid_request_signature') {
            throw new MeecoServiceError(
              `Failed to claim shared encryption key - the request signature was rejected by the API`
            );
          }
        }
        throw err;
      });
    const decryptedDataEncryptionKey = await this.cryppo.decryptSerializedWithPrivateKey({
      serialized: claimedKey.shared_key_claimed?.serialized_shared_key!,
      privateKeyPem: keyPair.privateKey
    });
    const reEncryptedDataEncryptionKey = await this.cryppo.encryptWithKey({
      key: user.key_encryption_key.key,
      data: decryptedDataEncryptionKey,
      strategy: this.cryppo.CipherStrategy.AES_GCM
    });

    return reEncryptedDataEncryptionKey;
  }

  private buildClaimKeySignature(encryptionSpaceId: string | undefined, privateKey: string) {
    const requestUrl = `${this.environment.keystore.url}/shared_keys/${encryptionSpaceId}/claim_key`;
    const verification = `--request-timestamp=${new ShareService.Date().toISOString()}`;
    const urlToSign = requestUrl + verification;
    return this.cryppo.signWithPrivateKey(privateKey, urlToSign);
  }

  /**
   * In the API: a share expects an `encrypted_value` property.
   * For a tile item - this is a stringified json payload of key/value
   * pairs where the key is the slot id and the value is the slot value
   * encrypted with a shared data encryption key.
   */
  private async convertSlotsToEncryptedValuesForShare(
    slots: DecryptedSlot[],
    sharedDataEncryptionKey: EncryptionKey
  ): Promise<PostSharesEncryptedValues[]> {
    const encryptions = slots
      .filter(slot => slot.value)
      .map(async slot => {
        const encrypted_value = await cryppo
          .encryptWithKey({
            data: slot.value || '',
            key: sharedDataEncryptionKey.key,
            strategy: this.cryppo.CipherStrategy.AES_GCM
          })
          .then(result => result.serialized);
        return {
          slot_id: slot.id,
          encrypted_value
        };
      });
    return Promise.all(encryptions);
  }
}

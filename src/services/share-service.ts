import * as cryppo from '@meeco/cryppo';
import * as VaultAPI from '@meeco/meeco-api-sdk';
import * as KeyStoreAPI from '@meeco/meeco-keystore-sdk';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../configs/auth-config';
import { EncryptionSpaceConfig } from '../configs/encryption-space-config';
import { ItemConfig } from '../configs/item-config';
import { ShareListConfig } from '../configs/share-list-config';
import { EncryptionKey } from '../models/encryption-key';
import { IEnvironment } from '../models/environment';
import { LocalSlot } from '../models/local-slot';
import { findConnectionBetween } from '../util/ find-connection-between';
import { ItemService } from './item-service';

interface ISharedEncryptionSpace {
  from_user_connection_id: string;
  to_user_connection_id: string;
  shared_data_encryption_key?: EncryptionKey;
}

export class ShareService {
  constructor(private environment: IEnvironment, private log: (message: string) => void) {}

  public async shareItem(fromUser: AuthConfig, toUser: AuthConfig, itemId: string) {
    const { fromUserConnection, toUserConnection } = await findConnectionBetween(
      fromUser,
      toUser,
      this.environment,
      this.log
    );

    this.log('Fetching shared encryption space');
    const sharedEncryptionSpace = await this.fetchSharedEncryptionSpace(
      fromUser,
      fromUserConnection,
      toUserConnection
    );

    const share = await this.shareItemFromVaultItem(
      fromUser,
      toUser,
      sharedEncryptionSpace,
      itemId,
      fromUserConnection.user_id
    );

    this.log('Sending shared data');
    const shareResult = await this.vaultShareApi(fromUser).sharesPost({
      shares: [share]
    });
    return {
      ...share,
      share: shareResult
    };
  }

  public async listShares(user: AuthConfig) {
    const result = await new VaultAPI.ShareApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    }).sharesGet();
    return ShareListConfig.encodeFromResult(result);
  }

  public async getSharedItem(user: AuthConfig, itemId: string) {
    const result = await new VaultAPI.ShareApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    })
      .sharesIdGet(itemId)
      .then(shares => shares);
    const [item] = result.items;
    const [share] = result.shares;
    const slots = result.slots;
    const space = await this.encryptionSpaceApi(user).encryptionSpacesIdGet(
      share.encryption_space_id
    );
    const decryptedSharedDataEncryptionKey = await cryppo.decryptWithKey({
      serialized: space.encryption_space_data_encryption_key.serialized_data_encryption_key,
      key: user.key_encryption_key.key
    });
    const key = EncryptionKey.fromRaw(decryptedSharedDataEncryptionKey);
    const decryptedSlots = await ItemService.decryptAllSlots(slots!, key);
    return ItemConfig.encodeFromJson({
      ...item,
      slots: decryptedSlots
    });
  }

  private async shareItemFromVaultItem(
    fromUser: AuthConfig,
    toUser: AuthConfig,
    sharedEncryptionSpace: ISharedEncryptionSpace,
    itemId: string,
    toUserId: string
  ) {
    const item = await this.itemApi(fromUser).itemsIdGet(itemId);

    if (!item) {
      throw new CLIError(`Item '${itemId}' not found`);
    }
    const { slots } = item;

    if (!sharedEncryptionSpace.shared_data_encryption_key) {
      this.log('No encryption space found - creating one');
      sharedEncryptionSpace = await this.configureSharedEncryptionSpace(
        fromUser,
        sharedEncryptionSpace.from_user_connection_id,
        toUser,
        sharedEncryptionSpace.to_user_connection_id
      );
    }

    this.log('Decrypting all slots');
    const decryptedSlots = await ItemService.decryptAllSlots(slots!, fromUser.data_encryption_key);
    this.log('Encrypting slots with shared key');
    const encrypted_values = await this.convertSlotsToEncryptedValuesForShare(
      decryptedSlots,
      sharedEncryptionSpace.shared_data_encryption_key!
    );
    return {
      shareable_id: itemId,
      shareable_type: 'Item',
      encrypted_values,
      distributable: false,
      outgoing: true,
      // TODO - this should be the connection id but API does not support it yet
      user_id: toUserId
    };
  }

  public async configureSharedEncryptionSpace(
    fromUser: AuthConfig,
    fromUserConnectionId: string,
    toUser: AuthConfig,
    toUserConnectionId: string
  ) {
    const fromResult = await this.createSharedEncryptionSpace(fromUser, fromUserConnectionId);
    const toResult = await this.claimSharedEncryptionSpace(toUser, toUserConnectionId);

    return {
      from_user_connection_id: fromResult.connectionId,
      to_user_connection_id: toResult.connectionId,
      shared_data_encryption_key: EncryptionKey.fromRaw(fromResult.dataEncryptionKey)
    };
  }

  public async fetchSharedEncryptionSpace(
    fromUser: AuthConfig,
    fromUserConnection: VaultAPI.Connection,
    toUserConnection: VaultAPI.Connection
  ): Promise<ISharedEncryptionSpace> {
    if (!fromUserConnection.encryption_space_id) {
      // Users have no shared encryption space
      return new EncryptionSpaceConfig({
        from_user_connection_id: fromUserConnection.id,
        to_user_connection_id: toUserConnection!.id
      });
    }

    this.log('Fetching shared encryption key');
    const sharedDataEncryptionKey = await this.encryptionSpaceApi(fromUser).encryptionSpacesIdGet(
      fromUserConnection.encryption_space_id
    );

    const decryptedSharedDataEncryptionKey = await cryppo.decryptWithKey({
      serialized: sharedDataEncryptionKey.encryption_space_data_encryption_key
        ?.serialized_data_encryption_key!,
      key: fromUser.key_encryption_key.key
    });

    return new EncryptionSpaceConfig({
      from_user_connection_id: fromUserConnection.id,
      to_user_connection_id: toUserConnection!.id,
      shared_data_encryption_key: EncryptionKey.fromRaw(decryptedSharedDataEncryptionKey)
    });
  }

  private async createSharedEncryptionSpace(fromUser: AuthConfig, connectionId: string) {
    this.log('Generating from user data encryption key');
    const fromUserEncryptionSpace = await this.createAndStoreNewDataEncryptionKey(fromUser);
    const encryptionSpaceId = fromUserEncryptionSpace.encryptionSpace?.encryption_space_id!;

    this.log('Fetching connection');
    const connection = await this.fetchConnectionWithId(fromUser, connectionId);

    const recipientPublicKey = connection.other_user_connection_public_key;
    if (!recipientPublicKey) {
      throw new CLIError('Other user public key missing!');
    }

    const shareableDataEncryptionKey = await cryppo.encryptWithPublicKey({
      data: fromUserEncryptionSpace.dataEncryptionKey,
      publicKeyPem: recipientPublicKey
    });

    this.log('Updating connection encryption space');
    await this.connectionApi(fromUser).connectionsConnectionIdEncryptionSpacePost(connection.id!, {
      encryption_space_id: encryptionSpaceId
    });

    this.log('Sending shared key');
    const sharedKey = await this.sharedKeyApi(fromUser).sharedKeysPost({
      encrypted_key: shareableDataEncryptionKey.serialized,
      external_id: encryptionSpaceId,
      public_key: recipientPublicKey,
      key_metadata: {
        key_type: cryppo.CipherStrategy.AES_GCM
      }
    });
    return {
      connection,
      dataEncryptionKey: fromUserEncryptionSpace.dataEncryptionKey,
      connectionId,
      fromUserSharedKey: sharedKey.shared_key
    };
  }

  private async claimSharedEncryptionSpace(toUser: AuthConfig, connectionId: string) {
    const connection = await this.fetchConnectionWithId(toUser, connectionId);
    const encryptionSpaceId = connection.other_user_connection_encryption_space_id!;
    this.log('Fetching key pair');
    const keyPair = await this.keyPairApi(toUser)
      .keypairsIdGet(connection.key_store_keypair_id)
      .then(res => res.keypair);

    const privateKey = await cryppo.decryptWithKey({
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
    const encryptionSpace = await this.encryptionSpaceApi(toUser).encryptionSpacesPost({
      encrypted_serialized_key: reEncryptedDataEncryptionKey.serialized
    });
    const { encryption_space_id } = encryptionSpace.encryption_space_data_encryption_key!;

    this.log('Updating shared encryption space');
    await this.connectionApi(toUser).connectionsConnectionIdEncryptionSpacePost(connectionId, {
      encryption_space_id
    });

    return {
      connection,
      connectionId,
      toUserEncryptionSpace: encryptionSpace.encryption_space_data_encryption_key
    };
  }

  private async createAndStoreNewDataEncryptionKey(user: AuthConfig) {
    const dataEncryptionKey = cryppo.generateRandomKey();
    const encryptedDataEncryptionKey = await cryppo.encryptWithKey({
      data: dataEncryptionKey,
      key: user.key_encryption_key.key,
      strategy: cryppo.CipherStrategy.AES_GCM
    });
    const encryptionSpace = await this.encryptionSpaceApi(user)
      .encryptionSpacesPost({
        encrypted_serialized_key: encryptedDataEncryptionKey.serialized
      })
      .then(result => result.encryption_space_data_encryption_key);

    return {
      dataEncryptionKey,
      encryptionSpace
    };
  }

  private async claimAndReEncryptSharedDataEncryptionKey(
    user: AuthConfig,
    encryptionSpaceId: string,
    keyPair: {
      privateKey: string;
      publicKey: string;
    }
  ) {
    const signature = await this.buildClaimKeySignature(encryptionSpaceId, keyPair.privateKey);
    const claimedKey = await this.sharedKeyApi(user).sharedKeysExternalIdClaimKeyPost(
      encryptionSpaceId,
      {
        public_key: keyPair.publicKey,
        request_signature: signature.serialized
      }
    );
    const decryptedDataEncryptionKey = await cryppo.decryptSerializedWithPrivateKey({
      serialized: claimedKey.shared_key_claimed?.serialized_shared_key!,
      privateKeyPem: keyPair.privateKey
    });
    const reEncryptedDataEncryptionKey = await cryppo.encryptWithKey({
      key: user.key_encryption_key.key,
      data: decryptedDataEncryptionKey,
      strategy: cryppo.CipherStrategy.AES_GCM
    });

    return reEncryptedDataEncryptionKey;
  }

  private buildClaimKeySignature(encryptionSpaceId: string | undefined, privateKey: string) {
    const requestUrl = `${this.environment.keystore.url}/shared_keys/${encryptionSpaceId}/claim_key`;
    const verification = `--request-timestamp=${new Date().toISOString()}`;
    const urlToSign = requestUrl + verification;
    return cryppo.signWithPrivateKey(privateKey, urlToSign);
  }

  private async fetchConnectionWithId(user: AuthConfig, connectionId: string) {
    this.log('Fetching connection');
    const connectionResponse = await this.connectionApi(user).connectionsIdGet(connectionId);
    const connection = connectionResponse.connection;
    if (!connection || !connection.id) {
      throw new CLIError(`Connection '${connectionId}' not found.`);
    }
    return connection;
  }

  /**
   * In the API: a share expects an `encrypted_value` property.
   * For a tile item - this is a stringified json payload of key/value
   * pairs where the key is the slot id and the value is the slot value
   * encrypted with a shared data encryption key.
   */
  private async convertSlotsToEncryptedValuesForShare(
    slots: LocalSlot[],
    sharedDataEncryptionKey: EncryptionKey
  ) {
    const encryptions = slots.map(async slot => {
      const encrypted =
        typeof slot.value === 'string'
          ? await cryppo
              .encryptWithKey({
                data: slot.value || '',
                key: sharedDataEncryptionKey.key,
                strategy: cryppo.CipherStrategy.AES_GCM
              })
              .then(result => result.serialized)
          : slot.value;
      return {
        [slot.id!]: encrypted
      };
    });
    const encryptedSlots = await Promise.all(encryptions);
    const encrypted_values = JSON.stringify(
      encryptedSlots.reduce((prev, next) => ({ ...prev, ...next }), {})
    );
    return encrypted_values;
  }

  /**
   * Helper methods for creating APIs from users
   */

  private itemApi(user: AuthConfig) {
    return new VaultAPI.ItemApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    });
  }

  private connectionApi(user: AuthConfig) {
    return new VaultAPI.ConnectionApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    });
  }

  private vaultShareApi(user: AuthConfig) {
    return new VaultAPI.ShareApi({
      apiKey: user.vault_access_token,
      basePath: this.environment.vault.url
    });
  }

  private encryptionSpaceApi(user: AuthConfig) {
    return new KeyStoreAPI.EncryptionSpaceApi({
      apiKey: user.keystore_access_token,
      basePath: this.environment.keystore.url
    });
  }

  private keyPairApi(user: AuthConfig) {
    return new KeyStoreAPI.KeypairApi({
      apiKey: user.keystore_access_token,
      basePath: this.environment.keystore.url
    });
  }

  private sharedKeyApi(user: AuthConfig) {
    return new KeyStoreAPI.SharedKeyApi({
      apiKey: user.keystore_access_token,
      basePath: this.environment.keystore.url
    });
  }
}

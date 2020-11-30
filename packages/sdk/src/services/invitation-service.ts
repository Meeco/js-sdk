import { Keypair as APIKeypair } from '@meeco/keystore-api-sdk';
import { Connection, Invitation, InvitationApi } from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import { MeecoServiceError } from '../models/service-error';
import { SymmetricKey } from '../models/symmetric-key';
import Service, { IDEK, IKEK, IKeystoreToken, IVaultToken } from './service';

export class InvitationService extends Service<InvitationApi> {
  public getAPI(token: IVaultToken): InvitationApi {
    return this.vaultAPIFactory(token.vault_access_token).InvitationApi;
  }

  /**
   * Create an invitation token for a Connection (exchanging public keys to share Items).
   * @param connectionName Used in the new Connection, only visible to the creating user.
   * @param keypairId Use this public key in the new Connection. This is a Keystore Keypair.id (not external_id).
   * Throws an error if the key pair does not exist.
   */
  public async create(
    credentials: IVaultToken & IKeystoreToken & IDEK & IKEK,
    connectionName: string,
    keypairId?: string
  ): Promise<Invitation> {
    const {
      vault_access_token,
      keystore_access_token,
      key_encryption_key,
      data_encryption_key,
    } = credentials;

    let keyPair: APIKeypair;

    if (keypairId) {
      keyPair = await this.getKeyPair(keystore_access_token, keypairId);
    } else {
      keyPair = await this.createAndStoreKeyPair(keystore_access_token, key_encryption_key);
    }

    const encryptedName: string = await this.encryptNameOrDefault(
      data_encryption_key,
      connectionName,
      'New Connection'
    );

    this.logger.log('Sending invitation request');
    return this.vaultAPIFactory(vault_access_token)
      .InvitationApi.invitationsPost({
        public_key: {
          keypair_external_id: keyPair.id,
          public_key: keyPair.public_key,
        },
        invitation: {
          encrypted_recipient_name: encryptedName,
        },
      })
      .then(result => result.invitation);
  }

  /**
   * Create a Connection from an Invitation token.
   * @param connectionName Used in the new Connection, only visible to the creating user.
   * @param invitationToken From an existing Invitation request. Throws an exception if it does not exist.
   * @param keypairId Use this public key in the new Connection. This is a Keystore Keypair.id (not external_id).
   * Throws an error if the key pair does not exist.
   */
  public async accept(
    credentials: IVaultToken & IKeystoreToken & IKEK & IDEK,
    name: string,
    invitationToken: string,
    keypairId?: string
  ): Promise<Connection> {
    const {
      keystore_access_token,
      vault_access_token,
      key_encryption_key,
      data_encryption_key,
    } = credentials;

    let keyPair: APIKeypair;

    if (keypairId) {
      keyPair = await this.getKeyPair(keystore_access_token, keypairId);
    } else {
      keyPair = await this.createAndStoreKeyPair(keystore_access_token, key_encryption_key);
    }

    const encryptedName: string = await this.encryptNameOrDefault(
      data_encryption_key,
      name,
      'New Connection'
    );

    this.logger.log('Accepting invitation');
    return this.vaultAPIFactory(vault_access_token)
      .ConnectionApi.connectionsPost({
        public_key: {
          keypair_external_id: keyPair.id,
          public_key: keyPair.public_key,
        },
        connection: {
          encrypted_recipient_name: encryptedName,
          invitation_token: invitationToken,
        },
      })
      .then(res => res.connection);
  }

  private async encryptNameOrDefault(
    dek: SymmetricKey,
    name: string,
    defaultName: string
  ): Promise<string> {
    let input = name;
    if (name === '') {
      this.logger.warn('Connection Name was empty, using default');
      input = defaultName;
    }

    this.logger.log('Encrypting recipient name');
    return <Promise<string>>dek.encryptString(input);
  }

  private async getKeyPair(keystoreToken: string, id: string): Promise<APIKeypair> {
    try {
      return await this.keystoreAPIFactory(keystoreToken)
        .KeypairApi.keypairsIdGet(id)
        .then(result => result.keypair);
    } catch (error) {
      if ((<Response>error).status === 404) {
        throw new MeecoServiceError(`KeyPair with id '${id}' not found`);
      }
      throw error;
    }
  }

  private async createAndStoreKeyPair(
    keystoreToken: string,
    keyEncryptionKey: SymmetricKey
  ): Promise<APIKeypair> {
    this.logger.log('Generating key pair');
    const keyPair = await DecryptedKeypair.generate();

    const toPrivateKeyEncrypted = await keyEncryptionKey.encryptKey(keyPair.privateKey);

    const { keypair: resultKeypair } = await this.keystoreAPIFactory(
      keystoreToken
    ).KeypairApi.keypairsPost({
      public_key: keyPair.publicKey.key,
      encrypted_serialized_key: toPrivateKeyEncrypted,
      // API will 500 without
      metadata: {},
      external_identifiers: [],
    });

    return resultKeypair;
  }
}

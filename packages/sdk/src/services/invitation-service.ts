import { Connection, Invitation, InvitationApi } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import Service from './service';

export class InvitationService extends Service<InvitationApi> {
  public getAPI(vaultToken: string): InvitationApi {
    return this.vaultAPIFactory(vaultToken).InvitationApi;
  }

  public async create(name: string, auth: AuthData): Promise<Invitation> {
    const keyPair = await this.createAndStoreKeyPair(
      auth.keystore_access_token,
      auth.key_encryption_key
    );

    this.logger.log('Encrypting recipient name');
    const encryptedName: string = await this.encryptName(name, auth.data_encryption_key);

    this.logger.log('Sending invitation request');
    return await this.getAPI(auth.vault_access_token)
      .invitationsPost({
        public_key: {
          keypair_external_id: keyPair.keystoreStoredKeyPair.id,
          public_key: keyPair.keyPair.publicKey,
        },
        invitation: {
          encrypted_recipient_name: encryptedName,
        },
      })
      .then(result => result.invitation);
  }

  public async accept(name: string, invitationToken: string, auth: AuthData): Promise<Connection> {
    const keyPair = await this.createAndStoreKeyPair(
      auth.keystore_access_token,
      auth.key_encryption_key
    );

    this.logger.log('Encrypting connection name');
    const encryptedName: string = await this.encryptName(name, auth.data_encryption_key);

    this.logger.log('Accepting invitation');
    return await this.vaultAPIFactory(auth)
      .ConnectionApi.connectionsPost({
        public_key: {
          keypair_external_id: keyPair.keystoreStoredKeyPair.id,
          public_key: keyPair.keyPair.publicKey,
        },
        connection: {
          encrypted_recipient_name: encryptedName,
          invitation_token: invitationToken,
        },
      })
      .then(res => res.connection);
  }

  private encryptName(name: string, dek: EncryptionKey) {
    return Service.cryppo
      .encryptWithKey({
        data: name,
        key: dek.key,
        strategy: Service.cryppo.CipherStrategy.AES_GCM,
      })
      .then(result => result.serialized);
  }

  private async createAndStoreKeyPair(keystoreToken: string, keyEncryptionKey: EncryptionKey) {
    this.logger.log('Generating key pair');
    const keyPair = await Service.cryppo.generateRSAKeyPair();

    const toPrivateKeyEncrypted = await Service.cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: keyEncryptionKey.key,
      strategy: Service.cryppo.CipherStrategy.AES_GCM,
    });

    const keystoreStoredKeyPair = await this.keystoreAPIFactory(keystoreToken)
      .KeypairApi.keypairsPost({
        public_key: keyPair.publicKey,
        encrypted_serialized_key: toPrivateKeyEncrypted.serialized,
        // API will 500 without
        metadata: {},
        external_identifiers: [],
      })
      .then(result => result.keypair);

    return {
      keyPair,
      keystoreStoredKeyPair,
    };
  }
}

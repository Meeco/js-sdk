import { Keypair as APIKeypair } from '@meeco/keystore-api-sdk';
import {
  ConnectionResponseWithCreatedSharesReport,
  Invitation,
  InvitationApi,
  InvitationsResponse,
  PostInvitation,
} from '@meeco/vault-api-sdk';
import DecryptedKeypair from '../models/decrypted-keypair';
import { MeecoServiceError } from '../models/service-error';
import { SymmetricKey } from '../models/symmetric-key';
import Service, { IDEK, IKEK, IKeystoreToken, IPageOptions, IVaultToken } from './service';

interface ICreateInvitationOptions {
  keypairId?: string;
  delegationIntent?: { delegationToken: string; delegateRole: string };
  isMultistepWorkflow?: boolean;
  senderToRecipientData?: any;
}

export enum InvitationStateEnum {
  New = 'new',
  Connected = 'connected',
  Rejected = 'rejected',
  Accepted = 'accepted',
  Cancelled = 'cancelled',
  Expired = 'expired',
}

export class InvitationService extends Service<InvitationApi> {
  public getAPI(token: IVaultToken): InvitationApi {
    return this.vaultAPIFactory(token).InvitationApi;
  }

  /**
   * Retrieves invitations that the current user has created. Parameter state fetches invitations with a certain state.
   * @param state only fetch invitations with a certain state. Currenty there are 5 states: new, connected, accepted, rejected, cancelled, expired, If parameter state is not submitted, only invitations with states new, accepted and rejected are fetched.
   * @param keypairId Use this public key in the new Connection. This is a Keystore Keypair.id (not external_id).
   * Throws an error if the key pair does not exist.
   */
  public async list(
    credentials: IVaultToken & IKeystoreToken & IDEK & IKEK,
    options?: IPageOptions,
    state?: InvitationStateEnum
  ): Promise<InvitationsResponse> {
    this.logger.log('Sending invitation request');
    const invitations = await this.vaultAPIFactory(credentials).InvitationApi.invitationsGet(
      state,
      options?.nextPageAfter,
      options?.perPage,
      options?.page
    );

    return invitations;
  }

  /**
   * Retrieves invitations that the current user has created. Parameter state fetches invitations with a certain state.
   * @param keypairId Use this public key in the new Connection. This is a Keystore Keypair.id (not external_id).
   * Throws an error if the key pair does not exist.
   */
  public async get(
    credentials: IVaultToken & IKeystoreToken & IDEK & IKEK,
    id: string
  ): Promise<Invitation> {
    this.logger.log('Sending invitation request');
    const { invitation } = await this.vaultAPIFactory(credentials).InvitationApi.invitationsIdGet(
      id
    );

    return invitation;
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
    {
      keypairId,
      delegationIntent,
      isMultistepWorkflow = false,
      senderToRecipientData,
    }: ICreateInvitationOptions = {},
    senderDid?: string
  ): Promise<Invitation> {
    const { key_encryption_key, data_encryption_key } = credentials;

    let keyPair: APIKeypair;

    if (keypairId) {
      keyPair = await this.getKeyPair(credentials, keypairId);
    } else {
      keyPair = await this.createAndStoreKeyPair(credentials, key_encryption_key);
    }

    const encryptedName: string = await this.encryptNameOrDefault(
      data_encryption_key,
      connectionName,
      'New Connection'
    );

    this.logger.log('Sending invitation request');

    return this.vaultAPIFactory(credentials)
      .InvitationApi.invitationsPost({
        public_key: {
          keypair_external_id: keyPair.id,
          public_key: keyPair.public_key,
        },
        invitation: <PostInvitation>{
          encrypted_recipient_name: encryptedName,
          delegation_token: delegationIntent?.delegationToken,
          delegate_role: delegationIntent?.delegateRole,
          multistep_workflow: isMultistepWorkflow.toString(),
          sender_to_recipient_data: senderToRecipientData,
          sender_did: senderDid,
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
   * @returns ConnectionResponseWithCreatedSharesReport
   */
  public async accept(
    credentials: IVaultToken & IKeystoreToken & IKEK & IDEK,
    name: string,
    invitationToken: string,
    keypairId?: string,
    recipientDid?: string
  ): Promise<ConnectionResponseWithCreatedSharesReport> {
    const { key_encryption_key, data_encryption_key } = credentials;

    let keyPair: APIKeypair;

    if (keypairId) {
      keyPair = await this.getKeyPair(credentials, keypairId);
    } else {
      keyPair = await this.createAndStoreKeyPair(credentials, key_encryption_key);
    }

    const encryptedName: string = await this.encryptNameOrDefault(
      data_encryption_key,
      name,
      'New Connection'
    );

    this.logger.log('Accepting invitation');
    return this.vaultAPIFactory(credentials)
      .ConnectionApi.connectionsPost({
        public_key: {
          keypair_external_id: keyPair.id,
          public_key: keyPair.public_key,
        },
        connection: {
          encrypted_recipient_name: encryptedName,
          invitation_token: invitationToken,
          recipient_did: recipientDid,
        },
      })
      .then(res => res);
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

  private async getKeyPair(credentials: IKeystoreToken, id: string): Promise<APIKeypair> {
    try {
      return await this.keystoreAPIFactory(credentials)
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
    credentials: IKeystoreToken,
    keyEncryptionKey: SymmetricKey
  ): Promise<APIKeypair> {
    this.logger.log('Generating key pair');
    const keyPair = await DecryptedKeypair.generate();

    const toPrivateKeyEncrypted = await keyEncryptionKey.encryptKey(keyPair.privateKey);

    const { keypair: resultKeypair } = await this.keystoreAPIFactory(
      credentials
    ).KeypairApi.keypairsPost({
      public_key: keyPair.publicKey.pem,
      encrypted_serialized_key: toPrivateKeyEncrypted,
      // API will 500 without
      metadata: {},
      external_identifiers: [],
    });

    return resultKeypair;
  }
}

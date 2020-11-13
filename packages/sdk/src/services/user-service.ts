import { KeyEncryptionKey, Keypair } from '@meeco/keystore-api-sdk';
import { MeResponse, User, UserApi } from '@meeco/vault-api-sdk';
import { AuthData } from '../models/auth-data';
import { ERROR_CODES, MeecoServiceError } from '../models/service-error';
import { SRPSession } from '../models/srp-session';
import { SymmetricKey } from '../models/symmetric-key';
import Secrets from '../util/secrets';
import Service, { IKeystoreToken, IVaultToken } from './service';

/**
 * Create and update Meeco Users.
 */
export class UserService extends Service<UserApi> {
  // This should be more like `auth:my-user:api-sandbox.meeco.me` but the api does not support it
  static VAULT_PAIR_EXTERNAL_IDENTIFIER = 'auth';
  public readonly vaultKeypairExternalId = UserService.VAULT_PAIR_EXTERNAL_IDENTIFIER;

  private keyGen = Secrets;

  public getAPI(token: IVaultToken): UserApi {
    return this.vaultAPIFactory(token.vault_access_token).UserApi;
  }

  private async requestKeyPair(credentials: IKeystoreToken): Promise<Keypair> {
    const vaultUserApi = this.keystoreAPIFactory(credentials.keystore_access_token).KeypairApi;
    return vaultUserApi
      .keypairsExternalIdExternalIdGet(this.vaultKeypairExternalId)
      .then(res => res.keypair);
  }

  private async requestExternalAdmissionTokens(credentials: IKeystoreToken) {
    const keystoreExternalAdmissionApi = this.keystoreAPIFactory(credentials.keystore_access_token)
      .ExternalAdmissionTokensApi;
    this.logger.log('Request external admission tokens from keystore');
    return keystoreExternalAdmissionApi
      .externalAdmissionTokensGet()
      .then(res => res.external_admission_token);
  }

  private async generateAndStoreKeyEncryptionKey(credentials: IKeystoreToken, derivedKey: string) {
    this.logger.log('Generate and store key encryption key');
    const kek = Service.cryppo.generateRandomKey();

    const encryptedKEK = await Service.cryppo.encryptWithKey({
      strategy: Service.cryppo.CipherStrategy.AES_GCM,
      key: derivedKey,
      data: kek,
    });
    const keystoreKeyEncryptionKeyApi = this.keystoreAPIFactory(credentials.keystore_access_token)
      .KeyEncryptionKeyApi;

    await keystoreKeyEncryptionKeyApi.keyEncryptionKeyPost({
      serialized_key_encryption_key: encryptedKEK.serialized,
    });
    return kek;
  }

  private async getKeyEncryptionKey(credentials: IKeystoreToken): Promise<KeyEncryptionKey> {
    this.logger.log('Requesting key encryption key');
    const keystoreKeyEncryptionKeyApi = this.keystoreAPIFactory(credentials.keystore_access_token)
      .KeyEncryptionKeyApi;
    return keystoreKeyEncryptionKeyApi
      .keyEncryptionKeyGet()
      .then(result => result.key_encryption_key);
  }

  private async generateAndStoreDataEncryptionKey(
    keyEncryptionKey: string,
    sessionAuthentication: string
  ) {
    this.logger.log('Generate and store data encryption key');
    const dek = Service.cryppo.generateRandomKey();
    const dekEncryptedWithKEK = await Service.cryppo.encryptWithKey({
      data: dek,
      key: keyEncryptionKey,
      strategy: Service.cryppo.CipherStrategy.AES_GCM,
    });
    const keystoreDataEncryptionKeyApi = this.keystoreAPIFactory(sessionAuthentication)
      .DataEncryptionKeyApi;
    const stored = await keystoreDataEncryptionKeyApi.dataEncryptionKeysPost({
      serialized_data_encryption_key: dekEncryptedWithKEK.serialized,
    });
    return {
      key: dek,
      serializedEncrypted: dekEncryptedWithKEK.serialized,
      id: stored.data_encryption_key.id,
    };
  }

  private getDataEncryptionKey(sessionAuthentication, encryptionSpaceId: string) {
    this.logger.log('Requesting data encryption key');
    const keystoreDataEncryptionKeyApi = this.keystoreAPIFactory(sessionAuthentication)
      .DataEncryptionKeyApi;
    return keystoreDataEncryptionKeyApi
      .dataEncryptionKeysIdGet(encryptionSpaceId)
      .then(result => result.data_encryption_key);
  }

  private async generateAndStoreVaultKeyPair(
    credentials: IKeystoreToken,
    keyEncryptionKey: string
  ) {
    this.logger.log('Generate and store vault key pair');
    const keyPair: {
      privateKey: string;
      publicKey: string;
      bits: number;
    } = await Service.cryppo.generateRSAKeyPair();

    const keystoreKeypairApi = this.keystoreAPIFactory(credentials.keystore_access_token)
      .KeypairApi;

    const privateKeyEncryptedWithKEK = await Service.cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: keyEncryptionKey,
      strategy: Service.cryppo.CipherStrategy.AES_GCM,
    });

    await keystoreKeypairApi.keypairsPost({
      public_key: keyPair.publicKey,
      encrypted_serialized_key: privateKeyEncryptedWithKEK.serialized,
      external_identifiers: [this.vaultKeypairExternalId],
    });

    return keyPair;
  }

  private async createNewVaultUser(
    keyPair: {
      publicKey: string;
      privateKey: string;
    },
    vaultAdmissionToken: string
  ): Promise<{ user: User } & IVaultToken> {
    this.logger.log('Create vault api user');
    // No key required as we're only registering a new user
    const vaultUserApi = this.vaultAPIFactory('').UserApi;

    const vaultUser = await vaultUserApi.mePost({
      public_key: keyPair.publicKey,
      admission_token: vaultAdmissionToken,
    });
    const decryptedVaultSessionToken = await Service.cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: keyPair.privateKey,
      serialized: vaultUser.encrypted_session_authentication_string,
    });

    return {
      user: vaultUser.user,
      vault_access_token: decryptedVaultSessionToken,
    };
  }

  private async getVaultSession(keyPair: {
    publicKey: string;
    privateKey: string;
  }): Promise<{ user: User } & IVaultToken> {
    // No auth key required as we're only logging in
    const sessionApi = this.vaultAPIFactory('').SessionApi;

    const session = await sessionApi
      .sessionPost({
        public_key: keyPair.publicKey,
      })
      .then(result => result.session);
    const decryptedVaultSessionToken = await Service.cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: keyPair.privateKey,
      serialized: session.encrypted_session_authentication_string,
    });
    const userResponse = await this.getUser({ vault_access_token: decryptedVaultSessionToken });
    return {
      user: userResponse.user,
      vault_access_token: decryptedVaultSessionToken,
    };
  }

  private async createPrivateEncryptionSpaceForUser(
    credentials: IVaultToken & IKeystoreToken,
    keyEncryptionKey: string
  ) {
    const vaultUserApi = this.vaultAPIFactory(credentials.vault_access_token).UserApi;

    const dek = await this.generateAndStoreDataEncryptionKey(
      keyEncryptionKey,
      credentials.keystore_access_token
    );

    this.logger.log('Update vault encryption space');
    await vaultUserApi.mePut({
      user: {
        private_dek_external_id: dek.id,
      },
    });

    return dek;
  }

  /**
   * Request a new random username from the Keystore API to use for user creation
   */
  public async generateUsername(captcha_token?: string): Promise<string> {
    this.logger.log('Generating username');
    return this.keystoreAPIFactory('')
      .UserApi.srpUsernamePost({
        captcha_token,
      })
      .then(res => res.username);
  }

  /**
   * Usernames for secrets can be generated via {@link generateUsername}
   */
  public async create(userPassword: string, secret: string): Promise<AuthData> {
    await this.registerKeystoreViaSRP(userPassword, secret);

    const sessionAuthenticationToken = await this.loginKeystoreViaSRP(userPassword, secret);
    const { vault_api_admission_token } = await this.requestExternalAdmissionTokens(
      sessionAuthenticationToken
    );

    const derivedKey = await this.keyGen.derivePDKFromSecret(userPassword, secret);
    const kek = await this.generateAndStoreKeyEncryptionKey(sessionAuthenticationToken, derivedKey);
    const keyPair = await this.generateAndStoreVaultKeyPair(sessionAuthenticationToken, kek);
    const { vault_access_token } = await this.createNewVaultUser(
      keyPair,
      vault_api_admission_token
    );
    const privateEncryptionSpace = await this.createPrivateEncryptionSpaceForUser(
      { ...sessionAuthenticationToken, vault_access_token },
      kek
    );

    return new AuthData({
      secret,
      ...sessionAuthenticationToken,
      vault_access_token,
      data_encryption_key: SymmetricKey.fromRaw(privateEncryptionSpace.key),
      key_encryption_key: SymmetricKey.fromRaw(kek),
      passphrase_derived_key: SymmetricKey.fromRaw(derivedKey),
    });
  }

  private async registerKeystoreViaSRP(userPassword: string, secret: string) {
    this.logger.log('Initializing SRP');
    const username = this.keyGen.usernameFromSecret(secret);
    const srpPassword = await this.keyGen.srpPasswordFromSecret(userPassword, secret);
    const srpSession = await new SRPSession().init(username, srpPassword);
    const verifier = await srpSession.createVerifier();

    this.logger.log('Create SRP keystore user');
    await this.keystoreAPIFactory('')
      .UserApi.srpUsersPost({
        username,
        srp_salt: verifier.salt,
        srp_verifier: verifier.verifier,
      })
      .catch(err => {
        if (err.status === 400) {
          return err.json().then(result => {
            if (result.errors[0]?.error === 'username_taken') {
              // User exists - can continue on to try login instead
            } else {
              throw err;
            }
          });
        } else {
          throw err;
        }
      });
  }

  private async loginKeystoreViaSRP(userPassword: string, secret: string): Promise<IKeystoreToken> {
    const username = this.keyGen.usernameFromSecret(secret);
    this.logger.log('Starting SRP login');
    const password = await this.keyGen.srpPasswordFromSecret(userPassword, secret);
    const srpSession = await new SRPSession().init(username, password);
    const srp_a = await srpSession.getClientPublic();

    this.logger.log('Requesting SRP challenge from server');
    const challenge = await this.keystoreAPIFactory('')
      .UserApi.srpChallengesPost({
        srp_a,
        username,
      })
      .then(result => result.challenge);

    const srp_m = await srpSession.computeProofFromChallenge({
      salt: challenge.challenge_salt,
      serverPublic: challenge.challenge_b,
    });

    this.logger.log('Creating SRP session with proof');
    const authString = await this.keystoreAPIFactory('')
      .SessionApi.srpSessionPost({
        username,
        srp_a,
        srp_m,
      })
      .then(res => res.session.session_authentication_string)
      .catch(err => {
        if (err.status === 401) {
          throw new MeecoServiceError(
            'Login failed - please check details',
            ERROR_CODES.LoginFailed
          );
        }

        throw err;
      });

    return { keystore_access_token: authString };
  }

  /**
   * @deprecated use {@link getAuthData} instead.
   */
  public async get(userPassword: string, secret: string): Promise<AuthData> {
    return this.getAuthData(userPassword, secret);
  }

  /**
   * Given a user's passphrase and secret - fetch all data required to interact with Meeco's APIs on their behalf such as encryption keys
   */
  public async getAuthData(userPassword: string, secret: string): Promise<AuthData> {
    this.logger.log('Deriving keys');
    const derivedKey = await this.keyGen.derivePDKFromSecret(userPassword, secret);
    const sessionAuthenticationToken = await this.loginKeystoreViaSRP(userPassword, secret);

    const encryptedKek = await this.getKeyEncryptionKey(sessionAuthenticationToken);
    const kek = await Service.cryppo.decryptWithKey({
      serialized: encryptedKek.serialized_key_encryption_key,
      key: derivedKey,
    });

    const keyPair = await this.requestKeyPair(sessionAuthenticationToken);
    const decryptedPrivateKey = await Service.cryppo.decryptWithKey({
      serialized: keyPair.encrypted_serialized_key,
      key: kek,
    });

    const { user, vault_access_token } = await this.getVaultSession({
      privateKey: decryptedPrivateKey,
      publicKey: keyPair.public_key,
    });

    const encryptedDek = await this.getDataEncryptionKey(
      sessionAuthenticationToken,
      user.private_dek_external_id!
    );
    const dek = await Service.cryppo.decryptWithKey({
      serialized: encryptedDek.serialized_data_encryption_key,
      key: kek,
    });

    return new AuthData({
      secret,
      ...sessionAuthenticationToken,
      vault_access_token,
      data_encryption_key: SymmetricKey.fromRaw(dek),
      key_encryption_key: SymmetricKey.fromRaw(kek),
      passphrase_derived_key: SymmetricKey.fromRaw(derivedKey),
    });
  }

  /**
   * Creates a Keystore token for the user.
   * @param userPassword
   * @param secret
   */
  public async createKeystoreToken(userPassword: string, secret: string): Promise<IKeystoreToken> {
    // This method abstracts the login method type,
    // Better to do that than make the following method public.
    return this.loginKeystoreViaSRP(userPassword, secret);
  }

  /**
   * Create a new Vault session or get the token for an existing session.
   * @param userPassword
   * @param secret
   */
  public async getOrCreateVaultToken(userPassword: string, secret: string): Promise<IVaultToken> {
    this.logger.log('Deriving keys');
    // TODO - this is quite similar to getAuthData, only it doesn't download the DEK
    // Could factor out the differences.
    const sessionAuthenticationToken = await this.loginKeystoreViaSRP(userPassword, secret);
    const derivedKey = await this.keyGen.derivePDKFromSecret(userPassword, secret);
    const encryptedKek = await this.getKeyEncryptionKey(sessionAuthenticationToken);
    const kek = await Service.cryppo.decryptWithKey({
      serialized: encryptedKek.serialized_key_encryption_key,
      key: derivedKey,
    });

    const keyPair = await this.requestKeyPair(sessionAuthenticationToken);
    const decryptedPrivateKey = await Service.cryppo.decryptWithKey({
      serialized: keyPair.encrypted_serialized_key,
      key: kek,
    });
    const { vault_access_token } = await this.getVaultSession({
      privateKey: decryptedPrivateKey,
      publicKey: keyPair.public_key,
    });

    return { vault_access_token };
  }

  public getUser(credentials: IVaultToken): Promise<MeResponse> {
    return this.vaultAPIFactory(credentials.vault_access_token).UserApi.meGet();
  }

  /**
   * Invalidate all of the provided tokens.
   */
  public async deleteSessionTokens(vaultToken?: string, keystoreToken?: string): Promise<void> {
    return Promise.all([
      vaultToken ? this.vaultAPIFactory(vaultToken).SessionApi.sessionDelete() : null,
      keystoreToken ? this.keystoreAPIFactory(keystoreToken).SessionApi.sessionDelete() : null,
    ]).then(); // elide the individual responses
  }
}

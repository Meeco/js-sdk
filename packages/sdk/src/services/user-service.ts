import * as cryppo from '@meeco/cryppo';
import { AuthData } from '../models/auth-data';
import { EncryptionKey } from '../models/encryption-key';
import { Environment } from '../models/environment';
import { SRPSession } from '../models/srp-session';
import {
  keystoreAPIFactory,
  KeystoreAPIFactory,
  VaultAPIFactory,
  vaultAPIFactory
} from '../util/api-factory';
import { SecretService } from './secret-service';

export class UserService {
  // This should be more like `auth:my-user:api-sandbox.meeco.me` but the api does not support it
  static VAULT_PAIR_EXTERNAL_IDENTIFIER = 'auth';
  public readonly vaultKeypairExternalId;

  private keystoreApiFactory: KeystoreAPIFactory;
  private vaultApiFactory: VaultAPIFactory;

  private keyGen: SecretService;

  constructor(environment: Environment, private log = (msg: string) => {}) {
    this.keystoreApiFactory = keystoreAPIFactory(environment);
    this.vaultApiFactory = vaultAPIFactory(environment);
    this.vaultKeypairExternalId = UserService.VAULT_PAIR_EXTERNAL_IDENTIFIER;
    this.keyGen = new SecretService();
  }

  private requestKeyPair(keystoreSessionToken: string) {
    const vaultUserApi = this.keystoreApiFactory(keystoreSessionToken).KeypairApi;
    return vaultUserApi
      .keypairsExternalIdExternalIdGet(this.vaultKeypairExternalId)
      .then(res => res.keypair);
  }

  private requestExternalAdmissionTokens(sessionAuthenticationToken: string) {
    const keystoreExternalAdmissionApi = this.keystoreApiFactory(sessionAuthenticationToken)
      .ExternalAdmissionTokensApi;
    this.log('Request external admission tokens from keystore');
    return keystoreExternalAdmissionApi
      .externalAdmissionTokensGet()
      .then(res => res.external_admission_token);
  }

  private async generateAndStoreKeyEncryptionKey(
    derivedKey: string,
    sessionAuthentication: string
  ) {
    this.log('Generate and store key encryption key');
    const kek = cryppo.generateRandomKey();

    const encryptedKEK = await cryppo.encryptWithKey({
      strategy: cryppo.CipherStrategy.AES_GCM,
      key: derivedKey,
      data: kek
    });
    const keystoreKeyEncryptionKeyApi = this.keystoreApiFactory(sessionAuthentication)
      .KeyEncryptionKeyApi;

    await keystoreKeyEncryptionKeyApi.keyEncryptionKeyPost({
      serialized_key_encryption_key: encryptedKEK.serialized
    });
    return kek;
  }

  private getKeyEncryptionKey(sessionAuthentication: string) {
    this.log('Requesting key encryption key');
    const keystoreKeyEncryptionKeyApi = this.keystoreApiFactory(sessionAuthentication)
      .KeyEncryptionKeyApi;
    return keystoreKeyEncryptionKeyApi
      .keyEncryptionKeyGet()
      .then(result => result.key_encryption_key);
  }

  private async generateAndStoreDataEncryptionKey(
    keyEncryptionKey: string,
    sessionAuthentication: string
  ) {
    this.log('Generate and store data encryption key');
    const dek = cryppo.generateRandomKey();
    const dekEncryptedWithKEK = await cryppo.encryptWithKey({
      data: dek,
      key: keyEncryptionKey,
      strategy: cryppo.CipherStrategy.AES_GCM
    });
    const keystoreDataEncryptionKeyApi = this.keystoreApiFactory(sessionAuthentication)
      .DataEncryptionKeyApi;
    const stored = await keystoreDataEncryptionKeyApi.dataEncryptionKeysPost({
      serialized_data_encryption_key: dekEncryptedWithKEK.serialized
    });
    return {
      key: dek,
      serializedEncrypted: dekEncryptedWithKEK.serialized,
      id: stored.data_encryption_key.id
    };
  }

  private getDataEncryptionKey(sessionAuthentication, encryptionSpaceId: string) {
    this.log('Requesting data encryption key');
    const keystoreDataEncryptionKeyApi = this.keystoreApiFactory(sessionAuthentication)
      .DataEncryptionKeyApi;
    return keystoreDataEncryptionKeyApi
      .dataEncryptionKeysIdGet(encryptionSpaceId)
      .then(result => result.data_encryption_key);
  }

  private async generateAndStoreVaultKeyPair(
    keyEncryptionKey: string,
    sessionAuthentication: string
  ) {
    this.log('Generate and store vault key pair');
    const keyPair = await cryppo.generateRSAKeyPair();
    const keystoreKeypairApi = this.keystoreApiFactory(sessionAuthentication).KeypairApi;
    const privateKeyEncryptedWithKEK = await cryppo.encryptWithKey({
      data: keyPair.privateKey,
      key: keyEncryptionKey,
      strategy: cryppo.CipherStrategy.AES_GCM
    });
    await keystoreKeypairApi.keypairsPost({
      public_key: keyPair.publicKey,
      encrypted_serialized_key: privateKeyEncryptedWithKEK.serialized,
      external_identifiers: [this.vaultKeypairExternalId]
    });
    return keyPair;
  }

  private async createNewVaultUser(
    keyPair: {
      publicKey: string;
      privateKey: string;
    },
    vaultAdmissionToken: string
  ) {
    this.log('Create vault api user');
    // No key required as we're only registering a new user
    const vaultUserApi = this.vaultApiFactory('').UserApi;

    const vaultUser = await vaultUserApi.mePost({
      public_key: keyPair.publicKey,
      admission_token: vaultAdmissionToken
    });
    const decryptedVaultSessionToken = await cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: keyPair.privateKey,
      serialized: vaultUser.encrypted_session_authentication_string
    });

    return {
      user: vaultUser.user,
      token: decryptedVaultSessionToken
    };
  }

  private async getVaultSession(keyPair: { publicKey: string; privateKey: string }) {
    // No auth key required as we're only logging in
    const sessionApi = this.vaultApiFactory('').SessionApi;

    const session = await sessionApi
      .sessionPost({
        public_key: keyPair.publicKey
      })
      .then(result => result.session);
    const decryptedVaultSessionToken = await cryppo.decryptSerializedWithPrivateKey({
      privateKeyPem: keyPair.privateKey,
      serialized: session.encrypted_session_authentication_string
    });
    const userResponse = await this.getVaultUser(decryptedVaultSessionToken);
    return {
      user: userResponse.user,
      token: decryptedVaultSessionToken
    };
  }

  private async createPrivateEncryptionSpaceForUser(
    keyEncryptionKey: string,
    keystoreSessionToken: string,
    vaultSessionToken: string
  ) {
    const vaultUserApi = this.vaultApiFactory(vaultSessionToken).UserApi;

    const dek = await this.generateAndStoreDataEncryptionKey(
      keyEncryptionKey,
      keystoreSessionToken
    );

    this.log('Update vault encryption space');
    await vaultUserApi.mePut({
      user: {
        private_encryption_space_id: dek.id
      }
    });

    return dek;
  }

  public async generateUsername(captcha_token: string) {
    this.log('Generating username');
    return this.keystoreApiFactory('')
      .UserApi.srpUsernamePost({
        captcha_token
      })
      .then(res => res.username);
  }

  public async create(userPassword: string, secret: string): Promise<AuthData> {
    await this.registerKeystoreViaSRP(userPassword, secret);

    const sessionAuthenticationToken = await this.loginKeystoreViaSRP(userPassword, secret);
    const { vault_api_admission_token } = await this.requestExternalAdmissionTokens(
      sessionAuthenticationToken
    );

    const derivedKey = await this.keyGen.derivePDKFromSecret(userPassword, secret);
    const kek = await this.generateAndStoreKeyEncryptionKey(derivedKey, sessionAuthenticationToken);
    const keyPair = await this.generateAndStoreVaultKeyPair(kek, sessionAuthenticationToken);
    const vaultUser = await this.createNewVaultUser(keyPair, vault_api_admission_token);
    const privateEncryptionSpace = await this.createPrivateEncryptionSpaceForUser(
      kek,
      sessionAuthenticationToken,
      vaultUser.token
    );

    return new AuthData({
      secret,
      keystore_access_token: sessionAuthenticationToken,
      vault_access_token: vaultUser.token,
      data_encryption_key: EncryptionKey.fromRaw(privateEncryptionSpace.key),
      key_encryption_key: EncryptionKey.fromRaw(kek),
      passphrase_derived_key: EncryptionKey.fromRaw(derivedKey)
    });
  }

  private async registerKeystoreViaSRP(userPassword: string, secret: string) {
    const username = this.keyGen.usernameFromSecret(secret);
    const srpPassword = await this.keyGen.srpPasswordFromSecret(userPassword, secret);
    const srpSession = await new SRPSession().init(username, srpPassword);
    const verifier = await srpSession.createVerifier();

    this.log('Create SRP keystore user');
    await this.keystoreApiFactory('')
      .UserApi.srpUsersPost({
        username,
        srp_salt: verifier.salt,
        srp_verifier: verifier.verifier
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

  private async loginKeystoreViaSRP(userPassword: string, secret: string) {
    const username = this.keyGen.usernameFromSecret(secret);
    const password = await this.keyGen.srpPasswordFromSecret(userPassword, secret);
    const srpSession = await new SRPSession().init(username, password);
    const srp_a = await srpSession.getClientPublic();

    this.log('Requesting SRP challenge from server');
    const challenge = await this.keystoreApiFactory('')
      .UserApi.srpChallengesPost({
        srp_a,
        username
      })
      .then(result => result.challenge);

    const srp_m = await srpSession.computeProofFromChallenge({
      salt: challenge.challenge_salt,
      serverPublic: challenge.challenge_b
    });

    this.log('Creating SRP session with proof');
    return this.keystoreApiFactory('')
      .SessionApi.srpSessionPost({
        username,
        srp_a,
        srp_m
      })
      .then(res => res.session.session_authentication_string);
  }

  public async get(userPassword: string, secret: string): Promise<AuthData> {
    const derivedKey = await this.keyGen.derivePDKFromSecret(userPassword, secret);
    const sessionAuthenticationToken = await this.loginKeystoreViaSRP(userPassword, secret);

    const encryptedKek = await this.getKeyEncryptionKey(sessionAuthenticationToken);
    const kek = await cryppo.decryptWithKey({
      serialized: encryptedKek.serialized_key_encryption_key,
      key: derivedKey
    });

    const keyPair = await this.requestKeyPair(sessionAuthenticationToken);
    const decryptedPrivateKey = await cryppo.decryptWithKey({
      serialized: keyPair.encrypted_serialized_key,
      key: kek
    });

    const vaultUser = await this.getVaultSession({
      privateKey: decryptedPrivateKey,
      publicKey: keyPair.public_key
    });

    const encryptedDek = await this.getDataEncryptionKey(
      sessionAuthenticationToken,
      vaultUser.user.private_encryption_space_id!
    );
    const dek = await cryppo.decryptWithKey({
      serialized: encryptedDek.serialized_data_encryption_key,
      key: kek
    });

    return new AuthData({
      secret,
      keystore_access_token: sessionAuthenticationToken,
      vault_access_token: vaultUser.token,
      data_encryption_key: EncryptionKey.fromRaw(dek),
      key_encryption_key: EncryptionKey.fromRaw(kek),
      passphrase_derived_key: EncryptionKey.fromRaw(derivedKey)
    });
  }

  public getVaultUser(vaultAccessToken: string) {
    return this.vaultApiFactory(vaultAccessToken).UserApi.meGet();
  }

  public getVaultUserId(user: AuthData) {
    return this.vaultApiFactory(user)
      .UserApi.meGet()
      .then(result => result.user?.id);
  }
}

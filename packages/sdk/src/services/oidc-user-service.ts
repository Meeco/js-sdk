import {
  binaryStringToBytes,
  bytesToBinaryString,
  CipherStrategy,
  decodeDerivationArtifacts,
  decryptWithKey,
  DerivedKeyOptions,
  encodeDerivationArtifacts,
  EncryptionKey,
  encryptWithKey,
  generateDerivedKey,
  generateEncryptionVerificationArtifacts,
  generateRandomBytesString,
} from '@meeco/cryppo';
import {
  DataEncryptionKeyApi,
  KeyEncryptionKeyApi,
  KeypairApi,
  PassphraseDerivationArtefactApi,
} from '@meeco/keystore-api-sdk';
import { UserApi } from '@meeco/vault-api-sdk';
import { base58btc } from 'multiformats/bases/base58';
import { DIDBase, DIDKey, DIDWeb } from '../models/did-management';
import { Ed25519 } from '../models/did-management/Ed25519';
import { Ed25519PubCodec } from '../util/codecs';
import { DIDManagementService } from './did-management-service';
import Service, { IIdentityNetworkToken, IKEK, IKeystoreToken, IVaultToken } from './service';

type GetVaultKeysAuth = IVaultToken & IKeystoreToken;
type GetVaultDIDAuth = GetVaultKeysAuth & IIdentityNetworkToken & IKEK;

interface IMEKData {
  key: {
    key: EncryptionKey;
    options: DerivedKeyOptions;
  };
  derivationArtifacts: string;
  verificationArtifacts: string;
}

interface IKeyData {
  key: EncryptionKey;
  serializedKey: string;
}

type DIDMethodParam = 'did:web' | 'did:key';

export class OIDCUserService extends Service<UserApi> {
  public getAPI(token: IVaultToken): UserApi {
    return this.vaultAPIFactory(token).UserApi;
  }

  /**
   * @description Checks if provided Vault account has passphrase configured already.
   */
  public async hasPassphraseSet(auth: IKeystoreToken) {
    const keystoreFactory = this.keystoreAPIFactory(auth);
    const pdaApi = keystoreFactory.PassphraseDerivationArtefactApi;
    const kekApi = keystoreFactory.KeyEncryptionKeyApi;

    const isArtefactsSet = await pdaApi
      .passphraseDerivationArtefactGet()
      .then(() => true)
      .catch(err => {
        if (err?.status === 404) {
          return false;
        }
        throw err;
      });

    const isKekSet = await kekApi
      .keyEncryptionKeyGet()
      .then(() => true)
      .catch(err => {
        if (err?.status === 404) {
          return false;
        }
        throw err;
      });

    return isArtefactsSet && isKekSet;
  }

  /**
   * @description Loads existing Vault keys if present. Otherwise, creates new keys based on the provided passphrase
   */
  public async getVaultKeys(auth: GetVaultKeysAuth, passphrase: string) {
    const keystoreFactory = this.keystoreAPIFactory(auth);
    const pdaApi = keystoreFactory.PassphraseDerivationArtefactApi;
    const kekApi = keystoreFactory.KeyEncryptionKeyApi;
    const dekApi = keystoreFactory.DataEncryptionKeyApi;
    const meApi = this.getAPI(auth);

    const mek = await this.loadOrGenerateMEK(passphrase, pdaApi);
    const kek = await this.loadOrGenerateKEK(mek, kekApi);

    let vaultUser = await meApi.meGet().then(resp => resp.user);

    const { dek, dekId } = await this.loadOrGenerateDEK(
      kek,
      vaultUser.private_dek_external_id,
      dekApi
    );

    /**
     * Set DEK reference if one was not set before
     */
    if (!vaultUser.private_dek_external_id) {
      vaultUser = await meApi
        .mePut({ user: { private_dek_external_id: dekId } })
        .then(resp => resp.user);
    }

    return {
      mek: mek.key,
      kek,
      dek,
    };
  }

  /**
   * @description Loads existing Vault DID information and keys if present. Otherwise, registers and assigns one.
   * Supports only DIDWeb at the moment
   */
  public async getVaultDID(auth: GetVaultDIDAuth, defaultDIDMethod: DIDMethodParam = 'did:web') {
    const meApi = this.getAPI(auth);
    const keypairApi = this.keystoreAPIFactory(auth).KeypairApi;
    const didManagementService = new DIDManagementService(this.environment);

    const kek = EncryptionKey.fromBytes(auth.key_encryption_key.key);

    let vaultUser = await meApi.meGet().then(resp => resp.user);

    const result = await this.loadOrGenerateDID(
      auth,
      kek,
      vaultUser.did,
      didManagementService,
      keypairApi,
      defaultDIDMethod
    );

    /**
     * Set DID reference if one was not set before
     */
    if (!vaultUser.did) {
      vaultUser = await meApi.mePut({ user: { did: result.did } }).then(resp => resp.user);
    }

    return result;
  }

  /**
   * MEK
   */

  private async loadOrGenerateMEK(
    passphrase: string,
    pdaApi: PassphraseDerivationArtefactApi
  ): Promise<IMEKData> {
    try {
      return await this.loadMEK(passphrase, pdaApi);
    } catch (error: any) {
      if (error?.status === 404) {
        return this.generateMEK(passphrase, pdaApi);
      }
      throw error;
    }
  }

  private async loadMEK(passphrase: string, pdaApi: PassphraseDerivationArtefactApi) {
    const { passphrase_derivation_artefact: derivationArtifacts } =
      await pdaApi.passphraseDerivationArtefactGet();

    return this.deriveMEK(
      passphrase,
      DerivedKeyOptions.fromSerialized(derivationArtifacts.derivation_artefacts),
      derivationArtifacts.verification_artefacts
    );
  }

  private async generateMEK(passphrase: string, pdaApi: PassphraseDerivationArtefactApi) {
    const mek = await this.deriveMEK(passphrase);

    await pdaApi.passphraseDerivationArtefactPost({
      derivation_artefacts: mek.derivationArtifacts,
      verification_artefacts: mek.verificationArtifacts,
    });

    return mek;
  }

  private async deriveMEK(
    passphrase: string,
    derivedKeyOptions?: DerivedKeyOptions,
    verificationArtifacts?: string
  ) {
    if (
      (derivedKeyOptions && !verificationArtifacts) ||
      (verificationArtifacts && !derivedKeyOptions)
    ) {
      throw new Error('both artefacts params must be provided');
    }

    if (derivedKeyOptions) {
      const key2 = await derivedKeyOptions.deriveKey(passphrase);

      /**
       * Key verification
       */
      const { token: token2, encrypted } = decodeDerivationArtifacts(<string>verificationArtifacts);
      const verificationArtifactsDecryptedBytes = <Uint8Array>(
        await this.decryptBinary(key2, encrypted)
      );
      const verificationArtifactsDecrypted = bytesToBinaryString(
        verificationArtifactsDecryptedBytes
      );
      const decodedToken = verificationArtifactsDecrypted.split('.')[0];

      if (token2 !== decodedToken) {
        throw new Error('MEK verification failed');
      }

      return {
        key: {
          key: key2,
          options: derivedKeyOptions,
        },
        derivationArtifacts: derivedKeyOptions.serialize(),
        verificationArtifacts: <string>verificationArtifacts,
      };
    }

    const { token, salt } = generateEncryptionVerificationArtifacts();

    const key = await generateDerivedKey({ passphrase });

    const encryptedTokenAndSalt = await encryptWithKey({
      data: binaryStringToBytes(`${token}.${salt}`),
      key: key.key,
      strategy: CipherStrategy.AES_GCM,
    });

    return {
      key,
      derivationArtifacts: key.options.serialize(),
      /**
       * NOTE: taken from another app that implements this logic
       */
      verificationArtifacts: encodeDerivationArtifacts(<any>{
        token,
        encrypted: encryptedTokenAndSalt.serialized,
      }),
    };
  }

  /**
   * KEK
   */

  private async loadOrGenerateKEK(mek: IMEKData, kekApi: KeyEncryptionKeyApi) {
    try {
      return await this.loadKEK(mek, kekApi);
    } catch (error: any) {
      if (error?.status === 404) {
        return this.generateKEK(mek, kekApi);
      }
      throw error;
    }
  }

  private async loadKEK(mek: IMEKData, kekApi: KeyEncryptionKeyApi): Promise<IKeyData> {
    const { key_encryption_key: kekLoadResult } = await kekApi.keyEncryptionKeyGet();
    return this.decryptKey(mek.key.key, kekLoadResult.serialized_key_encryption_key);
  }

  private async generateKEK(mek: IMEKData, kekApi: KeyEncryptionKeyApi): Promise<IKeyData> {
    const kek = await this.generateKey(mek.key.key);

    await kekApi.keyEncryptionKeyPost({
      serialized_key_encryption_key: kek.serializedKey,
    });

    return kek;
  }

  /**
   * DEK
   */

  private async loadOrGenerateDEK(
    kek: IKeyData,
    privateDEKExternalId: string | null,
    dekApi: DataEncryptionKeyApi
  ) {
    if (privateDEKExternalId) {
      return this.loadDEK(kek, privateDEKExternalId, dekApi);
    }
    return this.generateDEK(kek, dekApi);
  }

  private async loadDEK(
    kek: IKeyData,
    privateDEKExternalId: string,
    dekApi: DataEncryptionKeyApi
  ): Promise<{ dek: IKeyData; dekId: string }> {
    const { data_encryption_key: dekLoadResult } = await dekApi.dataEncryptionKeysIdGet(
      privateDEKExternalId
    );
    const dek = await this.decryptKey(kek.key, dekLoadResult.serialized_data_encryption_key);
    return { dek, dekId: dekLoadResult.id };
  }

  private async generateDEK(
    kek: IKeyData,
    dekApi: DataEncryptionKeyApi
  ): Promise<{ dek: IKeyData; dekId: string }> {
    const dek = await this.generateKey(kek.key);

    const {
      data_encryption_key: { id: dekId },
    } = await dekApi.dataEncryptionKeysPost({
      serialized_data_encryption_key: dek.serializedKey,
    });

    return { dek, dekId };
  }

  /**
   * DID
   */
  private async loadOrGenerateDID(
    auth: GetVaultDIDAuth,
    kek: EncryptionKey,
    did: string | null,
    didManagementService: DIDManagementService,
    keypairApi: KeypairApi,
    defaultDIDMethod: DIDMethodParam
  ) {
    if (did) {
      return this.loadDID(kek, did, keypairApi);
    }
    return this.generateDID(auth, kek, keypairApi, didManagementService, defaultDIDMethod);
  }

  private async generateDID(
    auth: GetVaultDIDAuth,
    kek: EncryptionKey,
    keypairApi: KeypairApi,
    didManagementService: DIDManagementService,
    defaultDIDMethod: DIDMethodParam
  ) {
    const didSeed = binaryStringToBytes(generateRandomBytesString(32));
    const didKeypair = new Ed25519(didSeed);
    let didInstance: DIDBase;
    let verificationMethodId: string;

    switch (defaultDIDMethod) {
      case 'did:key':
        const codec = new Ed25519PubCodec();
        const encodedPubKey = base58btc.encode(codec.encode(didKeypair.getPublic()));
        didInstance = new DIDKey(didKeypair);
        verificationMethodId = `did:key:${encodedPubKey}#${encodedPubKey}`;
        break;

      case 'did:web':
        didInstance = new DIDWeb(didKeypair);
        verificationMethodId = (didInstance as DIDWeb).setVerificationMethod();
        (didInstance as DIDWeb)
          .setAssertionMethod(verificationMethodId)
          .setAuthentication(verificationMethodId);
        break;

      default:
        throw new Error('Not supported did method provided');
    }

    const createDidResult = await didManagementService.create(
      auth,
      didInstance,
      auth.organisation_id
    );

    const encryptedSeed = await this.encryptBinary(kek, didSeed);

    const newDid = createDidResult.didState?.did as string;

    await keypairApi.keypairsPost({
      encrypted_serialized_key: <string>encryptedSeed.serialized,
      public_key: didKeypair.getPublicKeyBase58(),
      metadata: {
        did: newDid,
        public_key_encoding: 'base58',
        private_key_info: 'stores encrypted 32 random bytes used as a secret to derive Ed25519 key',
      },
      external_identifiers: [
        this.generateKeypairExternalIdentifer(newDid),
        this.generateKeypairExternalIdentifer(verificationMethodId),
      ],
    });

    return {
      didSeed: <Uint8Array>didSeed,
      didKeypair,
      did: <string>createDidResult?.didState?.did,
    };
  }

  private async loadDID(kek: EncryptionKey, did: string, keypairApi: KeypairApi) {
    const { keypair } = await keypairApi.keypairsExternalIdExternalIdGet(
      this.generateKeypairExternalIdentifer(did)
    );

    const didSeed = await this.decryptBinary(kek, keypair.encrypted_serialized_key);

    return {
      didSeed: <Uint8Array>didSeed,
      didKeypair: new Ed25519(<Uint8Array>didSeed),
      did,
    };
  }

  /**
   * Utils
   */

  private async generateKey(key: EncryptionKey) {
    const newKey = EncryptionKey.generateRandom(32);
    const serializedKey = <string>(await this.encryptBinary(key, newKey.bytes)).serialized;

    return {
      key: newKey,
      serializedKey,
    };
  }

  private async decryptKey(key: EncryptionKey, data: string) {
    const bytes = await this.decryptBinary(key, data);

    return {
      key: EncryptionKey.fromBytes(<Uint8Array>bytes),
      serializedKey: data,
    };
  }

  private async encryptBinary(key: EncryptionKey, data: Uint8Array) {
    return encryptWithKey({
      key,
      data,
      strategy: CipherStrategy.AES_GCM,
    });
  }

  private decryptBinary(key: EncryptionKey, data: string) {
    return decryptWithKey({
      serialized: data,
      key,
    });
  }

  private generateKeypairExternalIdentifer(did: string, keyId?: string): string {
    return Buffer.from([did, keyId].filter(v => !!v).join('#')).toString('hex');
  }
}

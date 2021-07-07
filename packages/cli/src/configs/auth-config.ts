import {
  AuthData,
  DelegationService,
  keystoreAPIFactory,
  SymmetricKey,
  UserService,
  vaultAPIFactory,
  VaultAPIFactoryInstance,
} from '@meeco/sdk';
import { CLIError } from '@oclif/errors';
import { IYamlConfig } from './yaml-config';

interface IAuthMetadata {
  secret: string;
  vault_access_token: string;
  keystore_access_token: string;
  passphrase_derived_key: string | SymmetricKey; // base64
  key_encryption_key: string | SymmetricKey; // base64
  data_encryption_key: string | SymmetricKey; // base64
  delegation_id?: string;
  oidc_token?: string;
}

export class AuthConfig {
  static kind = 'Authentication';

  public readonly secret: string;
  public readonly vault_access_token: string;
  public readonly keystore_access_token: string;
  public data_encryption_key: SymmetricKey;
  public key_encryption_key: SymmetricKey;
  public readonly passphrase_derived_key: SymmetricKey;
  public delegation_id?: string;
  public oidc_token?: string;

  constructor(data: {
    secret: string;
    vault_access_token: string;
    keystore_access_token: string;
    data_encryption_key: SymmetricKey;
    key_encryption_key: SymmetricKey;
    passphrase_derived_key: SymmetricKey;
    delegation_id?: string;
    oidc_token?: string;
  }) {
    this.secret = data.secret;
    this.keystore_access_token = data.keystore_access_token;
    this.vault_access_token = data.vault_access_token;
    this.data_encryption_key = data.data_encryption_key;
    this.key_encryption_key = data.key_encryption_key;
    this.passphrase_derived_key = data.passphrase_derived_key;
    this.delegation_id = data.delegation_id;
    this.oidc_token = data.oidc_token;
  }

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IAuthMetadata>): AuthConfig {
    if (yamlConfigObj.kind !== AuthConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${AuthConfig.kind}')`
      );
    }
    return new AuthConfig({
      ...yamlConfigObj.metadata!,
      key_encryption_key: SymmetricKey.fromSerialized(
        yamlConfigObj.metadata!.key_encryption_key as string
      ),
      data_encryption_key: SymmetricKey.fromSerialized(
        yamlConfigObj.metadata!.data_encryption_key as string
      ),
      passphrase_derived_key: SymmetricKey.fromSerialized(
        yamlConfigObj.metadata!.passphrase_derived_key as string
      ),
    });
  }

  overrideWithFlags(flags) {
    this.delegation_id = flags.delegationId ? flags.delegationId : undefined;
    return this;
  }

  async loadDelegationDekIfNeeded(environment, updateStatus): Promise<AuthConfig> {
    if (this.delegation_id) {
      const vaultApi = vaultAPIFactory(environment)(this);
      const connection = await this.getConnectionForDelegationId(vaultApi);
      const delegationsService = new DelegationService(environment, updateStatus);
      const delegationToken = (connection?.own.integration_data || {})['delegation_token'];
      const keystoreApiUser = keystoreAPIFactory(environment)({
        ...this,
        delegation_id: undefined,
      });
      const { delegation } = await keystoreApiUser.DelegationApi.delegationsDelegationTokenGet(
        delegationToken
      );
      const kek = await delegationsService.getAccountOwnerKek(this, delegation);
      const user = await vaultApi.UserApi.meGet();
      this.key_encryption_key = kek;
      const userService = new UserService(environment, updateStatus);
      const dek = await userService.getDataEncryptionKey(
        this,
        user.user.private_dek_external_id || ''
      );
      this.data_encryption_key = dek;
    }
    return this;
  }

  private async getConnectionForDelegationId(vaultApi: VaultAPIFactoryInstance) {
    let cursor;
    let connection;
    do {
      const { next_page_after, connections } = await vaultApi.ConnectionApi.connectionsGet(cursor);
      cursor = next_page_after;
      connection = connections.find(conn => conn.own.user_id == this.delegation_id);
      // finish if there is a cursor and a connection
      // finish if there is is not a cursor
      // continue if there is a cursor but not a connection
    } while (cursor && !connection);
    if (!connection) {
      throw new Error('cannot find connection for delegation id');
    }
    return connection;
  }

  static fromMetadata(metadata: IAuthMetadata) {
    return AuthConfig.fromYamlConfig({
      kind: AuthConfig.kind,
      metadata,
      spec: {},
    });
  }

  static encodeFromAuthData(payload: AuthData): IYamlConfig<IAuthMetadata> {
    const payloadSortedAlphabetically: AuthData = Object.keys(payload)
      .sort()
      .reduce((prev, key) => ({ ...prev, [key]: payload[key] }), {} as any);
    return {
      kind: AuthConfig.kind,
      metadata: payloadSortedAlphabetically, // Note: SymmetricKey's should stringify with their own `toJSON()`
      spec: {},
    };
  }

  /**
   * Create a new AuthData instance from a serialized version
   */
  static fromJSON(json: any) {
    return new AuthData({
      data_encryption_key: SymmetricKey.fromSerialized(json.data_encryption_key),
      key_encryption_key: SymmetricKey.fromSerialized(json.key_encryption_key),
      keystore_access_token: json.keystore_access_token,
      passphrase_derived_key: SymmetricKey.fromSerialized(json.passphrase_derived_key),
      secret: json.secret,
      vault_access_token: json.vault_access_token,
      delegation_id: json.delegation_id,
      oidc_token: json.oidc_token,
    });
  }

  /**
   * Allow AuthData to be serialized for easier storage
   */
  toJSON() {
    return {
      data_encryption_key: this.data_encryption_key.toJSON(),
      key_encryption_key: this.key_encryption_key.toJSON(),
      keystore_access_token: this.keystore_access_token,
      passphrase_derived_key: this.passphrase_derived_key.toJSON(),
      secret: this.secret,
      vault_access_token: this.vault_access_token,
      delegation_id: this.delegation_id,
      oidc_token: this.oidc_token,
    };
  }
}

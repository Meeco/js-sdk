import { AuthData, SymmetricKey } from '@meeco/sdk';
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

interface IAuthSpec {
  loaded_delegations?: { [user_id: string]: LoadedDelegationSpec };
}

interface LoadedDelegation {
  data_encryption_key: SymmetricKey; // base64
  key_encryption_key: SymmetricKey; // base64
  connection_id: string;
  delegation_token: string;
}

interface LoadedDelegationSpec {
  data_encryption_key: string | SymmetricKey; // base64
  key_encryption_key: string | SymmetricKey; // base64
  connection_id: string;
  delegation_token: string;
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
  public loaded_delegations?: { [user_id: string]: LoadedDelegation };

  constructor(data: {
    secret: string;
    vault_access_token: string;
    keystore_access_token: string;
    data_encryption_key: SymmetricKey;
    key_encryption_key: SymmetricKey;
    passphrase_derived_key: SymmetricKey;
    delegation_id?: string;
    oidc_token?: string;
    loaded_delegations?: { [user_id: string]: LoadedDelegation };
  }) {
    this.secret = data.secret;
    this.keystore_access_token = data.keystore_access_token;
    this.vault_access_token = data.vault_access_token;
    this.data_encryption_key = data.data_encryption_key;
    this.key_encryption_key = data.key_encryption_key;
    this.passphrase_derived_key = data.passphrase_derived_key;
    this.delegation_id = data.delegation_id;
    this.oidc_token = data.oidc_token;
    this.loaded_delegations = data.loaded_delegations;
  }

  static fromYamlConfig(yamlConfigObj: IYamlConfig<IAuthMetadata, IAuthSpec>): AuthConfig {
    if (yamlConfigObj.kind !== AuthConfig.kind) {
      throw new CLIError(
        `Config file of incorrect kind: ${yamlConfigObj.kind} (expected '${AuthConfig.kind}')`
      );
    }
    const loadedDelegations = yamlConfigObj.spec?.loaded_delegations;
    const loadedDelegationsDeserializedKeys = {};
    if (loadedDelegations) {
      Object.keys(loadedDelegations).map(key => {
        loadedDelegationsDeserializedKeys[key] = {
          ...loadedDelegations[key],
          key_encryption_key: SymmetricKey.fromSerialized(
            loadedDelegations[key].key_encryption_key as string
          ),
          data_encryption_key: SymmetricKey.fromSerialized(
            loadedDelegations[key].data_encryption_key as string
          ),
        };
      });
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
      loaded_delegations: loadedDelegationsDeserializedKeys,
    });
  }

  overrideWithFlags(flags) {
    this.delegation_id = flags.delegationId ? flags.delegationId : undefined;
    return this;
  }

  static fromMetadata(metadata: IAuthMetadata) {
    return AuthConfig.fromYamlConfig({
      kind: AuthConfig.kind,
      metadata,
      spec: {},
    });
  }

  static encodeFromAuthData(payload: AuthData): IYamlConfig<IAuthMetadata, IAuthSpec> {
    const payloadSortedAlphabetically: AuthData = Object.keys(payload)
      .sort()
      .reduce((prev, key) => ({ ...prev, [key]: payload[key] }), {} as any);
    return {
      kind: AuthConfig.kind,
      metadata: payloadSortedAlphabetically, // Note: SymmetricKey's should stringify with their own `toJSON()`
      spec: {},
    };
  }

  static encodeFromAuthConfig(payload: AuthConfig): IYamlConfig<IAuthMetadata, IAuthSpec> {
    const payloadSortedAlphabetically: AuthConfig = Object.keys(payload)
      .sort()
      .reduce((prev, key) => ({ ...prev, [key]: payload[key] }), {} as any);
    const loadedDelegations = payload.loaded_delegations;
    const loadedDelegationsSerializedKeys = {};
    if (loadedDelegations) {
      Object.keys(loadedDelegations).map(key => {
        loadedDelegationsSerializedKeys[key] = {
          ...loadedDelegations[key],
          key_encryption_key: loadedDelegations[key].key_encryption_key.toJSON(),
          data_encryption_key: loadedDelegations[key].data_encryption_key.toJSON(),
        };
      });
    }
    const sortedPayload = { ...payloadSortedAlphabetically, loaded_delegations: undefined };
    return {
      kind: AuthConfig.kind,
      metadata: sortedPayload, // Note: SymmetricKey's should stringify with their own `toJSON()`
      spec: { loaded_delegations: loadedDelegationsSerializedKeys },
    };
  }

  /**
   * Create a new AuthConfig instance from a serialized version
   */
  static fromJSON(json: any) {
    const loadedDelegations = json.loaded_delegations;
    const loadedDelegationsDeserializedKeys = {};
    if (loadedDelegations) {
      Object.keys(loadedDelegations).map(key => {
        loadedDelegationsDeserializedKeys[key] = {
          ...loadedDelegations[key],
          key_encryption_key: SymmetricKey.fromSerialized(
            loadedDelegations[key].key_encryption_key as string
          ),
          data_encryption_key: SymmetricKey.fromSerialized(
            loadedDelegations[key].data_encryption_key as string
          ),
        };
      });
    }
    return new AuthConfig({
      data_encryption_key: SymmetricKey.fromSerialized(json.data_encryption_key),
      key_encryption_key: SymmetricKey.fromSerialized(json.key_encryption_key),
      keystore_access_token: json.keystore_access_token,
      passphrase_derived_key: SymmetricKey.fromSerialized(json.passphrase_derived_key),
      secret: json.secret,
      vault_access_token: json.vault_access_token,
      delegation_id: json.delegation_id,
      oidc_token: json.oidc_token,
      loaded_delegations: loadedDelegationsDeserializedKeys,
    });
  }

  /**
   * Allow AuthConfig to be serialized for easier storage
   */
  toJSON() {
    const loadedDelegations = this.loaded_delegations;
    const loadedDelegationsSerializedKeys = {};
    if (loadedDelegations) {
      Object.keys(loadedDelegations).map(key => {
        loadedDelegationsSerializedKeys[key] = {
          ...loadedDelegations[key],
          key_encryption_key: loadedDelegations[key].key_encryption_key.toJSON(),
          data_encryption_key: loadedDelegations[key].data_encryption_key.toJSON(),
        };
      });
    }
    return {
      data_encryption_key: this.data_encryption_key.toJSON(),
      key_encryption_key: this.key_encryption_key.toJSON(),
      keystore_access_token: this.keystore_access_token,
      passphrase_derived_key: this.passphrase_derived_key.toJSON(),
      secret: this.secret,
      vault_access_token: this.vault_access_token,
      delegation_id: this.delegation_id,
      oidc_token: this.oidc_token,
      loaded_delegations: loadedDelegationsSerializedKeys,
    };
  }
}

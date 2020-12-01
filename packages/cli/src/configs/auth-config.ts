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
}

export class AuthConfig {
  static kind = 'Authentication';

  public readonly secret: string;
  public readonly vault_access_token: string;
  public readonly keystore_access_token: string;
  public readonly data_encryption_key: SymmetricKey;
  public readonly key_encryption_key: SymmetricKey;
  public readonly passphrase_derived_key: SymmetricKey;

  constructor(data: {
    secret: string;
    vault_access_token: string;
    keystore_access_token: string;
    data_encryption_key: SymmetricKey;
    key_encryption_key: SymmetricKey;
    passphrase_derived_key: SymmetricKey;
  }) {
    this.secret = data.secret;
    this.keystore_access_token = data.keystore_access_token;
    this.vault_access_token = data.vault_access_token;
    this.data_encryption_key = data.data_encryption_key;
    this.key_encryption_key = data.key_encryption_key;
    this.passphrase_derived_key = data.passphrase_derived_key;
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
}

import { EncryptionKey } from './encryption-key';

export class EncryptionSpaceData {
  static readonly kind = 'EncryptionSpace';

  to_user_connection_id: string;
  from_user_connection_id: string;
  shared_data_encryption_key?: EncryptionKey;

  constructor(config: {
    to_user_connection_id: string;
    from_user_connection_id: string;
    shared_data_encryption_key?: EncryptionKey;
  }) {
    this.to_user_connection_id = config.to_user_connection_id;
    this.from_user_connection_id = config.from_user_connection_id;
    this.shared_data_encryption_key = config.shared_data_encryption_key;
  }

  toJSON() {
    return {
      kind: EncryptionSpaceData.kind,
      spec: {
        to_user_connection_id: this.to_user_connection_id,
        from_user_connection_id: this.from_user_connection_id,
        shared_data_encryption_key: this.shared_data_encryption_key
      }
    };
  }
}

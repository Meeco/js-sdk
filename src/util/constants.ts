export const DEFAULT_CLASSIFICATION_SCHEME = 'esafe';
export const DEFAULT_CLASSIFICATION_NAME = 'esafe_templates';
// MEE-212 This should be more like `auth:my-user:api-sandbox.meeco.me`
export const VAULT_PAIR_EXTERNAL_IDENTIFIER = 'auth';
export const SLOT_WHITELIST = [
  'id',
  'name',
  'created_at',
  'updated_at',
  'value',
  'label',
  'encrypted_value'
];
export const SLOT_TYPE_BLACKLIST = ['image', 'classification_node'];

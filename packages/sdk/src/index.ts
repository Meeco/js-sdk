/**
 * The publicly exposed API
 */
export * from './models/auth-data';
export * from './models/decrypted-item';
export { default as DecryptedKeypair } from './models/decrypted-keypair';
export * from './models/did-management';
export * from './models/environment';
export * from './models/file-attachment-data';
export * from './models/item-change';
export * from './models/item-map';
export * from './models/item-update';
export * from './models/new-item';
export * from './models/organization-auth-data';
export { default as RSAPrivateKey } from './models/rsa-private-key';
export { default as RSAPublicKey } from './models/rsa-public-key';
export * from './models/sdk-template';
export * from './models/service-error';
export * from './models/slot-types';
export * from './models/srp-session';
export * from './models/symmetric-key';
export * from './models/template-data';
export * from './services/client-task-queue-service';
export * from './services/connection-service';
export * from './services/credential-service';
export * from './services/delegation-invitation-service';
export * from './services/delegation-service';
export * from './services/did-management-service';
export * from './services/invitation-service';
export * from './services/item-service';
export * from './services/oidc-user-service';
export * from './services/organization-members-service';
export * from './services/organization-service';
export * from './services/organization-services-service';
export * from './services/presentation-request-service';
export * from './services/service';
export * from './services/share-service';
export * from './services/template-service';
export * from './services/user-service';
export * from './util/api-factory';
export * from './util/codecs';
export * from './util/constants';
export * from './util/did-management';
export * from './util/find-connection-between';
export * from './util/jwt';
export * from './util/paged';
export { default as Secrets } from './util/secrets';
export { default as SlotHelpers } from './util/slot-helpers';
export * from './util/transformers';
export * from './util/value-verification';
import _cryppo from './services/cryppo-service';
import {
  identityNetworkAPIFactory,
  keystoreAPIFactory,
  vaultAPIFactory,
  vcAPIFactory,
} from './util/api-factory';
export const _cryppoService = _cryppo;

export const mockableFactories = {
  vcAPIFactory,
  vaultAPIFactory,
  keystoreAPIFactory,
  identityNetworkAPIFactory,
};

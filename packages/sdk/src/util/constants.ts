export enum CREDENTIAL_FORMAT {
  'JWT_VC' = 'jwt_vc_json',
  'SD_JWT_VC' = 'vc+sd-jwt',
}

/**
 * Credential item attributes
 */
export const CREDENTIAL_ITEM = {
  TEMPLATE_NAME: 'verifiable_credential',
  JWT_SLOT_NAME: 'credential_jwt',
  JWT_SLOT_LABEL: 'Credential JWT',
  CREDENTIAL_FORMAT_SLOT_NAME: 'credential_format',
  CREDENTIAL_FORMAT_SLOT_LABEL: 'Credential format',
  ISSUER_SLOT_NAME: 'issuer',
  ISSUER_SLOT_LABEL: 'Issuer',
  SUBJECT_SLOT_NAME: 'subject',
  SUBJECT_SLOT_LABEL: 'Subject',
  ISSUED_AT_SLOT_NAME: 'issued_at',
  ISSUED_AT_SLOT_LABEL: 'Issued at',
  EXPIRES_AT_SLOT_NAME: 'expires_at',
  EXPIRES_AT_SLOT_LABEL: 'Expires at',
  CREDENTIAL_ID_SLOT_NAME: 'credential_id',
  CREDENTIAL_ID_SLOT_LABEL: 'Credential ID',
  SCHEMA_URL_NAME: 'schema_url',
  SCHEMA_URL_LABEL: 'Schema url',
  CREDENTIAL_TYPE_ID_NAME: 'credential_type_id',
  CREDENTIAL_TYPE_ID_LABEL: 'Credential type id',
  CREDENTIAL_TYPE_NAME_SLOT_NAME: 'credential_type_name',
  CREDENTIAL_TYPE_NAME_SLOT_LABEL: 'Credential type name',
  STYLES_SLOT_NAME: 'styles',
  STYLES_SLOT_LABEL: 'Styles',
  REVOCABLE_SLOT_NAME: 'revocable',
  REVOCABLE_SLOT_LABEL: 'Revocable',
  ISSUER_NAME_SLOT_NAME: 'issuer_name',
  ISSUER_NAME_SLOT_LABEL: 'Issuer name',
};

/**
 * Presentation request response item
 */
export const PRESENTATION_REQUEST_RESPONSE_ITEM = {
  TEMPLATE_NAME: 'presentation_request_response',
  ID_TOKEN_SLOT_NAME: 'id_token',
  ID_TOKEN_SLOT_LABEL: 'ID Token',
  VP_TOKEN_SLOT_NAME: 'vp_token',
  VP_TOKEN_SLOT_LABEL: 'VP Token',
  STATE_SLOT_NAME: 'state',
  STATE_SLOT_LABEL: 'State',
  VERIFICATION_RESULT_SLOT_NAME: 'verification_result',
  VERIFICATION_RESULT_SLOT_LABEL: 'Verification result',
  PRESENTATION_REQUEST_ID_SLOT_NAME: 'presentation_request_id',
  PRESENTATION_REQUEST_ID_SLOT_LABEL: 'Presentation request id',
  LAST_VERIFIED_AT_SLOT_NAME: 'last_verified_at',
  LAST_VERIFIED_AT_SLOT_LABEL: 'Last verified at',
};

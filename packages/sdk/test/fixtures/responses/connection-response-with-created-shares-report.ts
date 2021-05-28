import {
  ConnectionResponseWithCreatedSharesReport,
  OwnConnectionDataConnectionTypeEnum,
  OwnConnectionDataUserTypeEnum,
  TheOtherConnectedUserDataConnectionTypeEnum,
  TheOtherConnectedUserDataUserTypeEnum,
} from '@meeco/vault-api-sdk';

const response: ConnectionResponseWithCreatedSharesReport = {
  connection: {
    own: {
      id: 'f3fa4ede-77ea-4243-819e-7a4dd3b46edc',
      encrypted_recipient_name: null,
      integration_data: {},
      connection_type: OwnConnectionDataConnectionTypeEnum.Null,
      user_id: 'd06eb085-766d-4444-8d03-892eb60c6f2b',
      user_type: OwnConnectionDataUserTypeEnum.Human,
      user_public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtJNHr89OL5zM6TguC+pa\r\n1kks+TIVXNr8x89joCQWTVFdTumf1vCcWHSBzmI37wphb5qg3cmTq2CjZBpPOVYn\r\n49K7VD49VdTmxTQNQS+S9Uy/8aQ4EHzj9Hw/0dBNv0KXSkMeA4nh4NuPm+wKqHX0\r\nDkLZQENjk0zAOQYG5eKLZ9fRh3DTxGyuWn4gxMI5VW3MmUdFvNyCx+agVH8INMcN\r\nUA5OO2h/wrKlcXfAPO99NRuWMJ3KnqCOSNzKxfnC9esPSRNQTd9sPpP3vAtullKX\r\n58qJC/Bbrvt2frXK5M5DDoc5WtLw0JbpLO0s1Yl4Mrkhw3XVg8eYMOllRGhGytei\r\nyhswSedIBMB0cS8NNhXEvdqgAbgWHBQM4QvbIGR+ENFEFg25ATlMNgFz0gs1UaFy\r\nJRvSbyTvowfopFgR3zaUb7d4CjkRfEWEDJ5wNaae4QxrINxJ9O+YswddJqORjEOK\r\np0PI6L6Jtgzl5hCoYTiVg24EMHu9ytCYk/RwLwWZzu2KYcLuVWKWO28dAbrVB8Ny\r\nfcJgr7SziqqUvMNSstWanZR81UIy3BN7DR2hOD35NCg4Rfj4WZ2xv3OdLHXT0mu1\r\n1pMnmNfARzp8KX+cE4NYkc6LlN2ZGhFtnXKgJj671OZ7jhQYNFy/z4gqonG+KOSB\r\nyM4/L3eJFmUYz+pPWGwGdVMCAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      user_keypair_external_id: '68533f74-6165-49a7-939e-79e5e756dc57',
    },
    the_other_user: {
      id: 'f0cdb46e-7178-4034-a58a-c93d6e5b4da9',
      integration_data: {},
      connection_type: TheOtherConnectedUserDataConnectionTypeEnum.Null,
      user_id: '7ffdb069-9c8a-48a8-b36f-d974e1e87702',
      user_type: TheOtherConnectedUserDataUserTypeEnum.Human,
      user_public_key:
        '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArG3WlFD9Di1LuqM/qwLD\r\nlRoYvCxkgFSGeIOqEB7dhVj10iKUCGFFcldCVd7NtF5A2DSjsVBxXNV/fnHybiOA\r\nqCPMHQpdjal4x05/0MffHB+MtNJuneCiq0eHxF3tmkDpzwW1Fs+eYcRFk10oYvFH\r\nU1RjrWsdMLDraZtrHsg0Xyy2AAImTyWjT2hUPqUjK8Cc4NTNLB/ULLVDUf2fK2hu\r\nvAlkExSfq1wvYa/dOnFQgvnHUn2IIfRWdvt0VWUjF49+dXafTcD6j8gMHQtdm6J6\r\nf5sTuUofMWiJZ80E48AAGUqVGTajpkV2y5jxMHzenKOOcm6pYyUgr9hzzK/8OMlQ\r\n/AJ7wQ+Su5M+IL3GWMBPiVzUufhRMh7wYEiComvP/38mj/jMujkS8CPGzk5mt6NB\r\nPMAY1aXk3Nggckavkwbg+AeO719v1zAemvHaWxnByjqTfBERFd+uppXlw1xD7cmG\r\n6zKeD/FMnh+S+nHQPOM59Qd3xt7mcrYlbAHzU+F17MbnCLos6eHM+s9/lISfy3X4\r\nD3yWghFnLhCtW9tBnHWnYQTpzost07McB5FKliRijTGC5wZi70saZznLaVk2isdf\r\ndaM7iF4i6UJLZOZxjLQiGB4vBB/sjfuMih9t6HLtvZhXwbrBOKho1aLatLK+5j/o\r\nCzE+PrN2YWsMLh3jFtXgQC8CAwEAAQ==\r\n-----END PUBLIC KEY-----\r\n',
      user_keypair_external_id: '2076385c-5fb1-4b1b-9966-7fbd6282d308',
    },
  },
  created_shares_report: [],
};

export default response;

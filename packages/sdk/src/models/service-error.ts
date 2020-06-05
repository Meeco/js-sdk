export const ERROR_CODES = {
  InvalidSecretFormat: 'INVALID_SECRET_FORMAT',
  LoginFailed: 'LOGIN_FAILED'
};

export class MeecoServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

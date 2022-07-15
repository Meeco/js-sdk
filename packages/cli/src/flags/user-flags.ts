import { Flags } from '@oclif/core';

export const userFlags = {
  password: Flags.string({
    char: 'p',
    description: 'the password of the user (will be prompted for if not provided)',
    required: false,
    exclusive: ['user'],
  }),
  secret: Flags.string({
    char: 's',
    description: 'the secret key of the user (will be prompted for if not provided)',
    required: false,
    exclusive: ['user'],
  }),
};

export default userFlags;

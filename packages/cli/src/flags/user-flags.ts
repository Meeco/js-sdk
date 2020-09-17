import { flags } from '@oclif/command';

export const userFlags = {
  password: flags.string({
    char: 'p',
    description: 'the password of the user (will be prompted for if not provided)',
    required: false,
    exclusive: ['user'],
  }),
  secret: flags.string({
    char: 's',
    description: 'the secret key of the user (will be prompted for if not provided)',
    required: false,
    exclusive: ['user'],
  }),
};

export default userFlags;

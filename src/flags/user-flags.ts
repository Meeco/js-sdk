import { flags } from '@oclif/command';
export const userFlags = {
  user: flags.string({
    char: 'c',
    description: 'user config file',
    required: false,
    exclusive: ['password', 'secret']
  }),
  password: flags.string({
    char: 'p',
    description: 'the password of the user',
    required: false,
    exclusive: ['user']
  }),
  secret: flags.string({
    char: 's',
    description: 'the secret key of the user',
    required: false,
    exclusive: ['user']
  })
};

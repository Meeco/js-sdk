import { flags } from '@oclif/command';

export const authFlags = {
  auth: flags.string({
    char: 'a',
    required: true,
    description: 'auth yaml file',
    default: '.user.yaml'
  })
};

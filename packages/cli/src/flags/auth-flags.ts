import { flags } from '@oclif/command';

export const authFlags = {
  auth: flags.string({
    char: 'a',
    required: true,
    description: 'Authorization config file yaml file (if not using the default .user.yaml)',
    default: '.user.yaml',
  }),
};

export default authFlags;

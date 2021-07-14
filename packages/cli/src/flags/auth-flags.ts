import { flags } from '@oclif/command';

export const authFlags = {
  auth: flags.string({
    char: 'a',
    required: true,
    description: 'Authorization config yaml file (if not using the default .user.yaml)',
    default: '.user.yaml',
  }),
  delegationId: flags.string({
    required: false,
    description: 'delegation id of the connection to perform the task on behalf of',
  }),
};

export default authFlags;

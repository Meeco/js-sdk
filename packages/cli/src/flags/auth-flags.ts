import { Flags } from '@oclif/core';

export const authFlags = {
  auth: Flags.string({
    char: 'a',
    required: true,
    description: 'Authorization config yaml file (if not using the default .user.yaml)',
    default: '.user.yaml',
  }),
  delegationId: Flags.string({
    required: false,
    description: 'delegation id of the connection to perform the task on behalf of',
  }),
};

export default authFlags;

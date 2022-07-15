import { Flags } from '@oclif/core';

export const pageFlags = {
  all: Flags.boolean({
    description: 'Get all possible results from web API, possibly with multiple calls.',
    default: false,
  }),
};

export default pageFlags;

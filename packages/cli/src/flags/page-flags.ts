import { flags } from '@oclif/command';

export const pageFlags = {
  all: flags.boolean({
    description: 'Get all possible results from web API, possibly with multiple calls.',
    default: false,
  }),
};

export default pageFlags;

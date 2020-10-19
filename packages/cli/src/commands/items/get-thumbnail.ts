import { flags as _flags } from '@oclif/command';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetThumbnail extends MeecoCommand {
  static description = 'Download and decrypt an thumbnail by id';

  static example = `meeco items:get-thumbnail my-thumbnail-id -o ./my-thumbnail.png`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' }),
  };

  static args = [
    {
      name: 'thumbnailId',
      description: 'ID of the thumbnail to download',
      required: true,
    },
  ];

  async run() {
    this.error('Command temporarily disabled.');
  }
}

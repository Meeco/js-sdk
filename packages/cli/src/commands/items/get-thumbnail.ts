import { ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetThumbnail extends MeecoCommand {
  static description = 'Download and decrypt an thumbnail by id';

  static example = `meeco items:get-thumbnail my-thumbnail-id -o ./my-thumbnail.png`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' })
  };

  static args = [
    {
      name: 'thumbnailId',
      description: 'ID of the thumbnail to download',
      required: true
    }
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsGetThumbnail);
    const environment = await this.readEnvironmentFile();
    const { auth, outputPath } = flags;
    const { thumbnailId } = args;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const service = new ItemService(environment, this.updateStatus);
      await service.downloadThumbnail(
        thumbnailId,
        authConfig.vault_access_token,
        authConfig.data_encryption_key,
        outputPath
      );
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { encryptAndUploadThumbnail, ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-node';
import { ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { AuthConfig } from '../../configs/auth-config';
import { ThumbnailConfig } from '../../configs/thumbnail_config';
import { authFlags } from '../../flags/auth-flags';
import { readFileAsBuffer } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ThumbnailsCreate extends MeecoCommand {
  static description = 'Encrypt and attach a thumbnail to an attachment';

  static example = `meeco items:thumbnail-create -c ./thumbnail-config.yaml`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({
      char: 'c',
      required: true,
      description: 'thumbnail config yaml',
    }),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ThumbnailsCreate);
    const environment = await this.readEnvironmentFile();
    const { auth, config } = flags;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const thumbnailConfig = await this.readConfigFromFile(ThumbnailConfig, config);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }
      if (!thumbnailConfig) {
        this.error('Must specify a valid thumbnail config');
      }
      const thumbnailSizeType = thumbnailConfig.sizeType as ThumbnailType;
      if (!thumbnailSizeType || !ThumbnailTypes.includes(thumbnailSizeType)) {
        this.error('Please enter a thumbnail size/type');
      }
      const itemService = new ItemService(environment);
      const itemFetchResult: any = await itemService.get(authConfig, thumbnailConfig.itemId);
      if (!itemFetchResult) {
        this.error('Item not found');
      }
      const filePath = thumbnailConfig.file;
      try {
        await readFileAsBuffer(filePath);
        basename(filePath);
        lookup(filePath);
      } catch (err) {
        throw new CLIError(
          `Failed to read file '${filePath}' - please check that the file exists and is readable`
        );
      }
      const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === thumbnailConfig.slotId);
      if (!attachmentSlot) {
        this.error('Slot not found');
      }
      const attachmentSlotValueDek = attachmentSlot.value;

      const thumbnail = await encryptAndUploadThumbnail({
        thumbnailFilePath: thumbnailConfig.file,
        binaryId: attachmentSlot.attachment_id,
        attachmentDek: attachmentSlotValueDek,
        sizeType: thumbnailSizeType,
        authConfig: {
          vault_access_token: authConfig.vault_access_token,
          subscription_key: environment.vault.subscription_key,
        },
        vaultUrl: environment.vault.url,
      });

      this.printYaml(thumbnail);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

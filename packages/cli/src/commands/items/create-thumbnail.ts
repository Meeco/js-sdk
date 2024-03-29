import { EncryptionKey } from '@meeco/cryppo';
import { encryptAndUploadThumbnail, ThumbnailType, ThumbnailTypes } from '@meeco/file-storage-node';
import { ItemService } from '@meeco/sdk';
import { Flags as _flags } from '@oclif/core';
import { CLIError } from '@oclif/errors';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { AuthConfig } from '../../configs/auth-config';
import { ThumbnailConfig } from '../../configs/thumbnail_config';
import { authFlags } from '../../flags/auth-flags';
import { readFileAsBuffer } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsCreateThumbnail extends MeecoCommand {
  static description = 'Encrypt and attach a thumbnail to an attachment';

  static example = `meeco items:create-thumbnail -c ./thumbnail-config.yaml`;

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
    const { flags } = await this.parse(this.constructor as typeof ItemsCreateThumbnail);
    const environment = await this.readEnvironmentFile();
    const { auth, config } = flags;

    try {
      let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }
      authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);
      const thumbnailConfig = await this.readConfigFromFile(ThumbnailConfig, config);

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
        attachmentDek: EncryptionKey.fromSerialized(attachmentSlotValueDek),
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

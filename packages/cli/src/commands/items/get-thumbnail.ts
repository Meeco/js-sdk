import { downloadThumbnail, thumbSizeTypeToMimeExt } from '@meeco/file-storage-node';
import { ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import { writeFileContents } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetThumbnail extends MeecoCommand {
  static description = 'Download and decrypt an thumbnail by id';

  static example = `meeco items:get-thumbnail my-thumbnail-id -o ./`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' }),
  };

  static args = [
    {
      name: 'itemId',
      description: 'Id of item containing the slot of the attachment containing the thumbnail',
      required: true,
    },
    {
      name: 'slotId',
      description: 'Id of the the slot of the attachment containing the thumbnail',
      required: true,
    },
    {
      name: 'thumbnailId',
      description: 'ID of the thumbnail to download',
      required: true,
    },
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsGetThumbnail);
    const environment = await this.readEnvironmentFile();
    const { auth, outputPath } = flags;
    const { itemId, slotId, thumbnailId } = args;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const itemService = new ItemService(environment, this.updateStatus);
      const itemFetchResult: any = await itemService.get(itemId, authConfig);
      if (!itemFetchResult) {
        this.error('Item not found');
      }
      const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === slotId);
      if (!attachmentSlot) {
        this.error('Slot not found');
      }
      const attachmentSlotValueDek = attachmentSlot.value;

      const thumbnailRecord = itemFetchResult.thumbnails.find(
        thumbnail => thumbnail.id === thumbnailId
      );

      const { fileExtension } = thumbSizeTypeToMimeExt(thumbnailRecord.size_type);

      const file = await downloadThumbnail({
        id: thumbnailId,
        dataEncryptionKey: attachmentSlotValueDek,
        vaultUrl: environment.vault.url,
        authConfig: {
          data_encryption_key: authConfig.data_encryption_key.key,
          vault_access_token: authConfig.vault_access_token,
          subscription_key: environment.vault.subscription_key,
        },
      });
      if (!file) {
        this.error('No thumbnail file downloaded');
      }
      await this.writeFile(outputPath + `thumbnail.${fileExtension}`, file);
    } catch (err) {
      await this.handleException(err);
    }
  }

  writeFile(destination: string, decryptedContents: Buffer | Uint8Array) {
    this.updateStatus('Writing decrypted file to destination');
    return writeFileContents(destination, decryptedContents, {
      flag: 'wx', // Write if not exists but fail if the file exists
    }).catch(err => {
      if (err.code === 'EEXIST') {
        throw new CLIError(
          `The destination file '${destination}' exists - please use a different destination file`
        );
      } else {
        throw new CLIError(`Failed to write to destination file: '${err.message}'`);
      }
    });
  }
}

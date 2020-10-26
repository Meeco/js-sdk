import { largeFileUploadNode } from '@meeco/file-storage-node';
import { ItemService, SlotType, UpdateItem } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { AuthConfig } from '../../configs/auth-config';
import { FileAttachmentConfig } from '../../configs/file-attachment-config';
import { authFlags } from '../../flags/auth-flags';
import { readFileAsBuffer } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsAttachFile extends MeecoCommand {
  static description = 'Encrypt and attach a file to an item';

  static example = `meeco items:attach-file -c ./file-attachment-config.yaml`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({
      char: 'c',
      required: true,
      description: 'file attachment config yaml',
    }),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsAttachFile);
    const environment = await this.readEnvironmentFile();
    const { auth, config } = flags;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const fileConfig = await this.readConfigFromFile(FileAttachmentConfig, config);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }
      if (!fileConfig) {
        this.error('Must specify a valid file attachment config');
      }
      const itemService = new ItemService(environment);
      const itemFetchResult = await itemService.get(authConfig, fileConfig.itemId);

      const filePath = fileConfig.file;
      try {
        await readFileAsBuffer(filePath);
        basename(filePath);
        lookup(filePath);
      } catch (err) {
        throw new CLIError(
          `Failed to read file '${filePath}' - please check that the file exists and is readable`
        );
      }
      const data_encryption_key = authConfig.data_encryption_key.key;
      const vault_access_token = authConfig.vault_access_token;
      const uploadedFile = await largeFileUploadNode(fileConfig.file, environment, {
        data_encryption_key,
        vault_access_token,
        subscription_key: environment.vault.subscription_key,
      });
      const label = fileConfig.label;
      const existingItem = itemFetchResult.item;
      const itemUpdateData = new UpdateItem(existingItem.id, {
        slots: [
          {
            label,
            slot_type_name: SlotType.Attachment,
            attachment_attributes: {
              id: uploadedFile.attachment.id,
            },
            value: uploadedFile.dek,
          },
        ],
        label: existingItem.label,
      });
      const updated = await itemService.update(authConfig, itemUpdateData);

      this.printYaml({
        attachment: uploadedFile.attachment,
        slots: updated.slots.filter(slot => slot.attachment_id === uploadedFile.attachment.id),
        item: updated.item,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

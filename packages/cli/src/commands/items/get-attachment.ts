import { fileDownloadNode } from '@meeco/file-storage-node';
import { ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import { writeFileContents } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetAttachment extends MeecoCommand {
  static description = 'Download and decrypt an attachment by id';

  static example = `meeco items:get-attachment my-attachment-item-id my-attachment-slot-id -o ./my-attachment.txt`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' }),
  };

  static args = [
    {
      name: 'itemId',
      description: 'ID of the item the attachment slot is a part of',
      required: true,
    },
    {
      name: 'slotId',
      description: 'ID of the slot the attachment is attached to',
      required: true,
    },
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsGetAttachment);
    const environment = await this.readEnvironmentFile();
    const { auth, outputPath } = flags;
    const { itemId, slotId } = args;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const itemService = new ItemService(environment);
      const itemFetchResult: any = await itemService.get(itemId, authConfig);
      const attachmentSlot = itemFetchResult.slots.find(slot => slot.id === slotId);
      const attachmentSlotValueDek = attachmentSlot.value;
      const attachmentId = attachmentSlot.attachment_id;

      const downloadedFile = await fileDownloadNode(
        attachmentId,
        environment,
        {
          data_encryption_key: authConfig.data_encryption_key.key,
          vault_access_token: authConfig.vault_access_token,
        },
        attachmentSlotValueDek,
        this.updateStatus
      );
      await this.writeFile(outputPath + downloadedFile.fileName, downloadedFile.buffer);
    } catch (err) {
      await this.handleException(err);
    }
  }

  writeFile(destination: string, decryptedContents: Buffer) {
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

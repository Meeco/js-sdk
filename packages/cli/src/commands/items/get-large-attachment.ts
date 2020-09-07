import { largeFileDownloadNode } from '@meeco/file-storage-node';
import { flags as _flags } from '@oclif/command';
import * as fs from 'fs';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';
export default class ItemsGetLargeAttachment extends MeecoCommand {
  static description = 'Download and decrypt an attachment by id';

  static example = `meeco items:get-large-attachment my-attachment-id -o ./my-attachment.txt`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' })
  };

  static args = [
    {
      name: 'attachmentId',
      description: 'ID of the attachment to download',
      required: true
    }
  ];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof ItemsGetLargeAttachment);
    const environment = await this.readEnvironmentFile();
    const { auth, outputPath } = flags;
    const { attachmentId } = args;
    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }
      const downloaded = await largeFileDownloadNode(
        attachmentId,
        authConfig.data_encryption_key,
        authConfig.vault_access_token
      );

      fs.writeFileSync(outputPath + downloaded.direct_download.filename, downloaded.byteArray);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

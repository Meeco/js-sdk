import { fileDownloadNode } from '@meeco/file-storage-node';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import { writeFileContents } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetAttachment extends MeecoCommand {
  static description = 'Download and decrypt an attachment by id';

  static example = `meeco items:get-attachment my-attachment-id -o ./my-attachment.txt`;

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
    const { flags, args } = this.parse(this.constructor as typeof ItemsGetAttachment);
    const environment = await this.readEnvironmentFile();
    const { auth, outputPath } = flags;
    const { attachmentId } = args;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const downloadedFile = await fileDownloadNode(
        attachmentId,
        environment,
        authConfig,
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
      flag: 'wx' // Write if not exists but fail if the file exists
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

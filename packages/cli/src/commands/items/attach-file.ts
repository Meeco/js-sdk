import { largeFileUploadNode } from '@meeco/file-storage-node';
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

      const filePath = fileConfig.file;
      let file: Buffer, fileName: string, fileType: string;
      try {
        file = await readFileAsBuffer(filePath);
        fileName = basename(filePath);
        fileType = lookup(filePath) || 'application/octet-stream';
      } catch (err) {
        throw new CLIError(
          `Failed to read file '${filePath}' - please check that the file exists and is readable`
        );
      }
      this.log(file.toString());
      this.log(fileName);
      this.log(fileType);
      const uploadedFile = await largeFileUploadNode(fileConfig.file, environment, authConfig);

      this.printYaml(uploadedFile);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

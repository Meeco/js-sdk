import { largeFileUploadNode } from '@meeco/large-file-upload-node';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { FileAttachmentConfig } from '../../configs/file-attachment-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsAttachLargeFile extends MeecoCommand {
  static description = 'Encrypt and attach a file to an item';

  static example = `meeco items:attach-large-file -c ./file-attachment-config.yaml`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({
      char: 'c',
      required: true,
      description: 'file attachment config yaml'
    })
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsAttachLargeFile);
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

      const uploadedFile = await largeFileUploadNode(fileConfig.file, environment, authConfig);

      this.printYaml(uploadedFile);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

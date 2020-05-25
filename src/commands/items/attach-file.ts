import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { FileAttachmentConfig } from '../../configs/file-attachment-config';
import { authFlags } from '../../flags/auth-flags';
import { ItemService } from '../../services/item-service';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsAttachFile extends MeecoCommand {
  static description = 'Encrypt and attach a file to an item';

  static example = `meeco items:attach-file -c file-attachment-config.yaml`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({ char: 'c', required: true, description: 'file attachment config yaml' })
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

      const service = new ItemService(environment, this.updateStatus);
      await service.attachFile(fileConfig, authConfig);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

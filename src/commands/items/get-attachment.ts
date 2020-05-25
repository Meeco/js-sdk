import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import { ItemService } from '../../services/item-service';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsGetAttachment extends MeecoCommand {
  static description = 'Download and decrypt an attachment by id';

  static example = `meeco items:get-attachment -i my-attachment-id -o ./my-attachment.txt`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    attachmentId: _flags.string({ char: 'i', required: true, description: 'id of the attachment to download' }),
    outputPath: _flags.string({ char: 'o', required: true, description: 'output file path' })
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsGetAttachment);
    const environment = await this.readEnvironmentFile();
    const { auth, attachmentId, outputPath } = flags;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }

      const service = new ItemService(environment, this.updateStatus);
      await service.downloadAttachment(attachmentId, authConfig.vault_access_token, authConfig.data_encryption_key, outputPath);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

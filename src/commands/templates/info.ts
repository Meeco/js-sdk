import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { TemplateConfig } from '../../configs/template-config';
import { authFlags } from '../../flags/auth-flags';
import { TemplatesService } from '../../services/templates-service';
import { DEFAULT_CLASSIFICATION_NAME, DEFAULT_CLASSIFICATION_SCHEME } from '../../util/constants';
import MeecoCommand from '../../util/meeco-command';

export default class TemplatesInfo extends MeecoCommand {
  static description = 'Get more information about an item template';

  static examples = ['meeco templates:info password'];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [{ name: 'templateName', required: true }];

  async run() {
    try {
      const { flags, args } = this.parse(this.constructor as typeof TemplatesInfo);
      const { auth } = flags;
      const { templateName } = args;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const service = new TemplatesService(environment, authConfig!.vault_access_token);
      cli.action.start(`Fetching template '${templateName}'`);
      const result = await service.getTemplate(
        DEFAULT_CLASSIFICATION_SCHEME,
        DEFAULT_CLASSIFICATION_NAME,
        templateName
      );
      cli.action.stop();
      this.printYaml(TemplateConfig.encodeFromJSON(result));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

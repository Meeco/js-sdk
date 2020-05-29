import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { TemplateConfig } from '../../configs/template-config';
import { authFlags } from '../../flags/auth-flags';
import { TemplatesService } from '../../services/templates-service';
import { DEFAULT_CLASSIFICATION_NAME, DEFAULT_CLASSIFICATION_SCHEME } from '../../util/constants';
import MeecoCommand from '../../util/meeco-command';

export default class TemplatesList extends MeecoCommand {
  static description = 'List all the available item templates';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof TemplatesList);
      const { auth } = flags;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const service = new TemplatesService(environment, authConfig!.vault_access_token);
      cli.action.start('Fetching available templates');
      const templates = await service.listTemplates(
        DEFAULT_CLASSIFICATION_SCHEME,
        DEFAULT_CLASSIFICATION_NAME
      );
      cli.action.stop();
      this.printYaml(TemplateConfig.encodeFromList(templates));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

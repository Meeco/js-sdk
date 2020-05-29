import { AuthConfig } from '../../configs/auth-config';
import { ItemConfig } from '../../configs/item-config';
import { authFlags } from '../../flags/auth-flags';
import { TemplatesService } from '../../services/templates-service';
import { DEFAULT_CLASSIFICATION_NAME, DEFAULT_CLASSIFICATION_SCHEME } from '../../util/constants';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsCreateConfig extends MeecoCommand {
  static description = 'Provide a template name to construct an item config file';

  static example = `meeco items:create-config password`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [
    {
      name: 'templateName',
      description: 'Name of the template to use for the item',
      required: true
    }
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof ItemsCreateConfig);
    const environment = await this.readEnvironmentFile();
    const { templateName } = args;
    const { auth } = flags;
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }
    const service = new TemplatesService(environment, authConfig.vault_access_token);
    const template = await service.getTemplate(
      DEFAULT_CLASSIFICATION_SCHEME,
      DEFAULT_CLASSIFICATION_NAME,
      templateName
    );
    this.printYaml(ItemConfig.encodeFromTemplate(template));
  }
}

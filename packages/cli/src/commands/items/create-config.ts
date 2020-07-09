import { vaultAPIFactory } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { AuthConfig } from '../../configs/auth-config';
import { ItemConfig } from '../../configs/item-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsCreateConfig extends MeecoCommand {
  static description = 'Provide a template name to construct an item config file';

  static example = `meeco items:create-config password`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    classificationScheme: _flags.string({
      char: 's',
      default: undefined,
      required: false,
      description: 'Scope templates to a particular classification scheme'
    }),
    classificationName: _flags.string({
      char: 'n',
      default: undefined,
      required: false,
      description: 'Scope templates to a particular classification name'
    })
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
    const { auth, classificationName, classificationScheme } = flags;
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    const service = vaultAPIFactory(environment)(authConfig).ItemTemplateApi;
    const templates = await service.itemTemplatesGet(classificationScheme, classificationName);
    const template = templates.item_templates.find(_template => _template.name === templateName);

    if (!template) {
      throw new CLIError(`Template with name '${templateName}' not found`);
    }

    this.printYaml(
      ItemConfig.encodeFromTemplate({
        template,
        slots: templates.slots.filter(slot => template.slot_ids.includes(slot.id))
      })
    );
  }
}

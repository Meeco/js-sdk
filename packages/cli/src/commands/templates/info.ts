import { mockableFactories } from '@meeco/sdk';
import { Slot } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { TemplateConfig } from '../../configs/template-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class TemplatesInfo extends MeecoCommand {
  static description = 'Get more information about an item template';

  static examples = ['meeco templates:info password'];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    classificationScheme: _flags.string({
      char: 's',
      default: undefined,
      required: false,
      description: 'Scope templates to a particular classification scheme',
    }),
    classificationName: _flags.string({
      char: 'n',
      default: undefined,
      required: false,
      description: 'Scope templates to a particular classification name',
    }),
  };

  static args = [
    {
      name: 'templateName',
      required: true,
    },
  ];

  async run() {
    try {
      const { flags, args } = this.parse(this.constructor as typeof TemplatesInfo);
      const { auth, classificationName, classificationScheme } = flags;
      const { templateName } = args;
      const environment = await this.readEnvironmentFile();
      let authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
      if (!authConfig) {
        this.error('Valid auth config file must be supplied');
      }
      authConfig = this.returnDelegationAuthIfDelegationIdPresent(authConfig);
      const service = mockableFactories.vaultAPIFactory(environment)(authConfig).ItemTemplateApi;
      cli.action.start(`Fetching template '${templateName}'`);
      const result = await service.itemTemplatesGet(classificationScheme, classificationName);
      const matchingTemplates = result.item_templates.filter(
        template => template.name === templateName
      );
      if (matchingTemplates.length === 0) {
        throw new CLIError(`Template '${templateName}' not found`);
      }
      const keyedSlots = result.slots.reduce(
        (prev, slot) => ({
          ...prev,
          [slot.id]: slot,
        }),
        {}
      );

      const mappedTemplates = matchingTemplates.map(template => ({
        template,
        slots: template.slot_ids.map(slot => keyedSlots[slot]) as Slot[],
      }));

      cli.action.stop();
      this.printYaml(TemplateConfig.encodeFromJSON(mappedTemplates));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

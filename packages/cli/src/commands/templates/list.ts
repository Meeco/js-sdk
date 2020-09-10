import { getAllPaged, reducePages, vaultAPIFactory } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { TemplateConfig } from '../../configs/template-config';
import { authFlags } from '../../flags/auth-flags';
import { pageFlags } from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class TemplatesList extends MeecoCommand {
  static description = 'List all the available item templates';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
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
    label: _flags.string({
      char: 'l',
      default: undefined,
      required: false,
      description: 'Search label text',
    }),
  };

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof TemplatesList);
      const { auth, all, classificationName, classificationScheme, label } = flags;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const service = vaultAPIFactory(environment)(authConfig).ItemTemplateApi;
      cli.action.start('Fetching available templates');
      const templates = all
        ? await getAllPaged(cursor =>
            service.itemTemplatesGet(classificationScheme, classificationName, label, cursor)
          ).then(reducePages)
        : await service.itemTemplatesGet(classificationScheme, classificationName, label);

      cli.action.stop();
      this.printYaml(TemplateConfig.encodeListFromJSON(templates));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

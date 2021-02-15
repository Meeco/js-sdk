import { IItemListFilterOptions, ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsList extends MeecoCommand {
  static description = 'List the items that a user has in their vault';
  static examples = [
    `meeco items:list -a path/to/auth.yaml`,
    `meeco items:list --templateId e30a36a5-6cd3-4d58-b838-b3a96384beab --templateId e30a36a5-6cd3-4d58-b838-b3a96384beab -a path/to/auth.yaml`,
    `meeco items:list --scheme esafe -a path/to/auth.yaml`,
    `meeco items:list --classification pets --classification vehicles -a path/to/auth.yaml`,
    `meeco items:list --sharedWith e30a36a5-6cd3-4d58-b838-b3a96384beab -a path/to/auth.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    templateId: _flags.string({
      required: false,
      multiple: true,
      description: 'items with the given template ids are fetched',
    }),
    scheme: _flags.string({
      required: false,
      description: 'items with the given scheme are fetched',
    }),
    classification: _flags.string({
      required: false,
      multiple: true,
      description: 'items with the given classification are fetched',
    }),
    sharedWith: _flags.string({
      required: false,
      description:
        'item shared with provided user id are fetched. Works for items owned by the current user as well as for items owned by someone else and on-shared by the current user.',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsList);
    const { auth, all, templateId, scheme, classification, sharedWith } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ItemService(environment, this.log);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    const filters: IItemListFilterOptions = {
      templateId,
      scheme,
      classification,
      sharedWith,
    };

    try {
      const response = all
        ? await service.listAll(authConfig, filters)
        : await service.list(authConfig, filters);

      // TODO this should inline slots and classifications from the response
      this.printYaml({
        kind: 'Items',
        spec: response.items,
      });
    } catch (err) {
      await this.handleException(err);
    }
  }
}

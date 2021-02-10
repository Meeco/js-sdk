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
    `meeco items:list --templateIds e30a36a5-6cd3-4d58-b838-b3a96384beab -a path/to/auth.yaml`,
    `meeco items:list --classificationSchemeName esafe -a path/to/auth.yaml`,
    `meeco items:list --classificationNodeName pets -a path/to/auth.yaml`,
    `meeco items:list --classificationNodeName --classificationNodeNames pets,vehicles -a path/to/auth.yaml`,
  ];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    templateIds: _flags.string({
      required: false,
      description: 'a list of template IDs separated by commas',
    }),
    classificationSchemeName: _flags.string({
      required: false,
      description: 'items classified according to the given classification scheme are fetched',
    }),
    classificationNodeName: _flags.string({
      required: false,
      description:
        'items classified with a classification node with the given name are fetched. Cannot be used together with classification_node_names filter',
    }),
    classificationNodeNames: _flags.string({
      required: false,
      description:
        'items classified with classification node with the given names are fetched.Supports a list of string values separated by commas. Cannot be used together with classification_node_name filter',
    }),
    sharedWith: _flags.string({
      required: false,
      description:
        'items will be fetched which have been shared with the given user. Works for items owned by the current user as well as for items owned by someone else and on-shared by the current user',
    }),
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsList);
    const {
      auth,
      all,
      templateIds,
      classificationSchemeName,
      classificationNodeName,
      classificationNodeNames,
      sharedWith,
    } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    const service = new ItemService(environment, this.log);

    if (!authConfig) {
      this.error('Must specify a valid auth config file');
    }

    const filters: IItemListFilterOptions = {
      templateIds,
      classificationSchemeName,
      classificationNodeName,
      classificationNodeNames,
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

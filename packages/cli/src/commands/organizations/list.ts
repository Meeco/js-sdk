import { getAllPaged, reducePages, reportIfTruncated, vaultAPIFactory } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { OrganizationsGetModeEnum } from 'packages/file-storage-common/node_modules/@meeco/vault-api-sdk/lib/types';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationsListConfig } from '../../configs/organizations-list-config';
import authFlags from '../../flags/auth-flags';
import pageFlags from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsList extends MeecoCommand {
  static description = 'List organization. There are three modes: validated, requested and member';

  static examples = [`meeco organizations:list -m requested`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
    mode: _flags.string({
      char: 'm',
      default: 'validated',
      required: false,
      options: ['validated', 'requested', 'member'],
      description:
        'There are three modes: validated, requested and member \n validated - return all validated organizations \n requested - list organizations in the requested state that the current user has requested \n member - list organizations in which the current user is a member.',
    }),
  };

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof OrganizationsList);
      const { auth, all, mode } = flags;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      this.updateStatus('Fetching ' + mode + ' organizations');
      const api = vaultAPIFactory(environment)(authConfig);
      const modeParam = (mode === 'validated' ? undefined : mode) as OrganizationsGetModeEnum;

      const result = all
        ? await getAllPaged(cursor =>
            api.OrganizationsForVaultUsersApi.organizationsGet(modeParam, cursor)
          ).then(reducePages)
        : await api.OrganizationsForVaultUsersApi.organizationsGet(modeParam).then(
            reportIfTruncated(this.warn)
          );

      this.finish();
      this.printYaml(OrganizationsListConfig.encodeFromJSON(result.organizations));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { vaultAPIFactory } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationsListConfig } from '../../configs/organizations-list-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsList extends MeecoCommand {
  static description = 'List organization. There are three modes: validated, requested and member';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    mode: _flags.string({
      char: 'm',
      default: 'validated',
      required: false,
      options: ['validated', 'requested', 'member'],
      description:
        'There are three modes: validated, requested and member \n validated - return all validated organizations \n requested - list organizations in the requested state that the current user has requested \n member - list organizations in which the current user is a member.'
    })
  };

  async run() {
    try {
      const { flags } = this.parse(this.constructor as typeof OrganizationsList);
      const { auth, mode } = flags;
      const environment = await this.readEnvironmentFile();
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      cli.action.start('Fetching ' + mode + ' organizations');
      const result = await vaultAPIFactory(environment)(
        authConfig
      ).OrganizationsForVaultUsersApi.organizationsGet(mode === 'validated' ? undefined : mode);
      cli.action.stop();
      this.printYaml(OrganizationsListConfig.encodeFromJSON(result.organizations));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

import { vaultAPIFactory } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { authFlags } from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationsDelete extends MeecoCommand {
  static description =
    'Delete a requested organization. The user who requested the organization can use this command to delete the requested organization.';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags
  };

  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Organization'
    }
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof OrganizationsDelete);

    const { auth } = flags;
    const { id } = args;
    const environment = await this.readEnvironmentFile();

    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    try {
      await vaultAPIFactory(environment)(
        authConfig
      ).OrganizationsManagingOrganizationsApi.organizationsIdDelete(id);

      this.log('Organization successfully deleted');
    } catch (err) {
      await this.handleException(err);
    }
  }
}

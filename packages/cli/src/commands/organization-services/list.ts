import { getAllPaged, reducePages, reportIfTruncated, vaultAPIFactory } from '@meeco/sdk';
import { AuthConfig } from '../../configs/auth-config';
import { OrganizationServiceListConfig } from '../../configs/organization-services-list-config';
import { authFlags } from '../../flags/auth-flags';
import { pageFlags } from '../../flags/page-flags';
import MeecoCommand from '../../util/meeco-command';

export default class OrganizationServicesList extends MeecoCommand {
  static description = `List requested services for a given organization. Members of the organization with roles owner and admin can use this command to list the requested services for this organization.`;

  static examples = [`meeco organization-services:list <organization_id>`];

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    ...pageFlags,
  };

  static args = [{ name: 'organization_id', required: true }];

  async run() {
    const { flags, args } = this.parse(this.constructor as typeof OrganizationServicesList);
    const { auth, all } = flags;
    const { organization_id } = args;
    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);

    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }
    try {
      this.updateStatus('Fetching services');
      const api = vaultAPIFactory(environment)(authConfig).OrganizationsManagingServicesApi;
      const result = all
        ? await getAllPaged(cursor =>
            api.organizationsOrganizationIdRequestedServicesGet(organization_id, cursor)
          ).then(reducePages)
        : await api
            .organizationsOrganizationIdRequestedServicesGet(organization_id)
            .then(reportIfTruncated(this.warn));

      this.finish();
      this.printYaml(OrganizationServiceListConfig.encodeFromJSON(result.services));
    } catch (err) {
      await this.handleException(err);
    }
  }
}

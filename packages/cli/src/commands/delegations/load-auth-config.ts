import { DelegationService, mockableFactories, UserService } from '@meeco/sdk';
import { Connection } from '@meeco/vault-api-sdk';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class DelegationLoadAuthConfig extends MeecoCommand {
  static description =
    'Create a delegation inivitation for another user to become a delegate connection';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  async run() {
    const { flags } = this.parse(this.constructor as typeof DelegationLoadAuthConfig);
    const { auth } = flags;
    const environment = await this.readEnvironmentFile();
    const authConfig = (await this.readConfigFromFile(AuthConfig, auth))?.overrideWithFlags(flags);
    if (!authConfig) {
      this.error('authConfig must be present');
    }
    if (!authConfig.delegation_id) {
      this.error('--delegationId argument must be present');
    }

    try {
      const connection = await this.getConnectionForDelegationId(environment, authConfig);
      const delegationsService = new DelegationService(environment, this.updateStatus);
      const delegationToken = (connection?.the_other_user.integration_data || {})[
        'delegation_token'
      ];
      const keystoreApi = mockableFactories.keystoreAPIFactory(environment)({
        ...authConfig,
        delegation_id: undefined,
      });
      const { delegation } = await keystoreApi.DelegationApi.delegationsDelegationTokenGet(
        delegationToken
      );
      const kek = await delegationsService.getAccountOwnerKek(authConfig, delegation);
      const vaultApi = mockableFactories.vaultAPIFactory(environment)(authConfig);
      const user = await vaultApi.UserApi.meGet();
      const userService = new UserService(environment, this.updateStatus);
      const dek = await userService.getDataEncryptionKey(
        { ...authConfig, key_encryption_key: kek },
        user.user.private_dek_external_id || ''
      );

      const newAuthConfig = new AuthConfig({
        ...authConfig,
        loaded_delegations: {
          ...authConfig.loaded_delegations,
          [connection.the_other_user.user_id]: {
            data_encryption_key: dek,
            key_encryption_key: kek,
            connection_id: connection.own.id,
            delegation_token: delegationToken,
          },
        },
      });

      this.printYaml(AuthConfig.encodeFromAuthConfig(newAuthConfig));
    } catch (e) {
      this.error('unexpected error: ' + JSON.stringify(e));
    }
  }

  private async getConnectionForDelegationId(environment, authConfig: AuthConfig) {
    const vaultApi = mockableFactories.vaultAPIFactory(environment)({
      ...authConfig,
      delegation_id: undefined,
    });
    let cursor;
    let connection: Connection | undefined;
    do {
      const { next_page_after, connections } = await vaultApi.ConnectionApi.connectionsGet(cursor);
      cursor = next_page_after;
      connection = connections.find(
        conn => conn.the_other_user.user_id === authConfig.delegation_id
      );
      // finish if there is a cursor and a connection
      // finish if there is is not a cursor
      // continue if there is a cursor but not a connection
    } while (cursor && !connection);
    if (!connection) {
      throw new Error('cannot find connection for delegation id');
    }
    return connection;
  }
}

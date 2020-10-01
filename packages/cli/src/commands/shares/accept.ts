import { AcceptanceStatus, ShareService, vaultAPIFactory } from '@meeco/sdk';
import cli from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesAccept extends MeecoCommand {
  static description = 'Accept an incoming share';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
  };

  static args = [
    {
      name: 'shareId',
      required: true,
      description: 'ID of the share to accept',
    },
  ];

  async run() {
    const { args, flags } = this.parse(this.constructor as typeof SharesAccept);
    const { auth } = flags;
    const { shareId } = args;

    const environment = await this.readEnvironmentFile();
    const authConfig = await this.readConfigFromFile(AuthConfig, auth);
    if (!authConfig) {
      this.error('Valid auth config file must be supplied');
    }

    const service = new ShareService(environment, this.updateStatus);

    try {
      // get the incoming share
      const share = await vaultAPIFactory(environment)(authConfig)
        .SharesApi.incomingSharesIdGet(shareId)
        .then(response => response.share);

      let willAccept = true;
      // if acceptance is required prompt for user input
      if (share.acceptance_required === AcceptanceStatus.required) {
        this.log('Share Terms: ' + share.terms);
        willAccept = await cli.confirm('Do you accept the terms?');
      }

      if (willAccept) {
        const response = await service.acceptIncomingShare(authConfig, shareId);
        this.printYaml(response);
      } else {
        this.finish('Share terms not accepted');
      }
    } catch (err) {
      await this.handleException(err);
    }
  }
}

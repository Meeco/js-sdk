import { ShareService, vaultAPIFactory } from '@meeco/sdk';
import { ShareAcceptanceRequiredEnum } from '@meeco/vault-api-sdk';
import { flags as _flags } from '@oclif/command';
import cli from 'cli-ux';
import { AuthConfig } from '../../configs/auth-config';
import authFlags from '../../flags/auth-flags';
import MeecoCommand from '../../util/meeco-command';

export default class SharesAccept extends MeecoCommand {
  static description = 'Accept an incoming share';

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    yes: _flags.boolean({
      char: 'y',
      description: 'Automatically agree to any terms required by the sharer',
      required: false,
    }),
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
    const { auth, yes } = flags;
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
        .then(resp => resp.share);

      // if acceptance is required prompt for user input
      if (share.acceptance_required === ShareAcceptanceRequiredEnum.AcceptanceRequired) {
        this.log('Share Terms: ' + share.terms);
        if (!yes) {
          const willAccept = await cli.confirm('Do you accept the terms?');
          if (!willAccept) {
            this.finish('Share terms not accepted');
          }
        }
      }

      const response = await service.acceptIncomingShare(authConfig, shareId);
      this.printYaml(response);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

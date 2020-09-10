// import { ShareService } from '@meeco/sdk';
// import { AuthConfig } from '../../configs/auth-config';
// import { ShareListConfig } from '../../configs/share-list-config';
// import { authFlags } from '../../flags/auth-flags';
// import MeecoCommand from '../../util/meeco-command';

// export default class SharesList extends MeecoCommand {
//   static description = 'Get a list of shares for the specified user';

//   static flags = {
//     ...MeecoCommand.flags,
//     ...authFlags,
//   };

//   async run() {
//     const { flags } = this.parse(this.constructor as typeof SharesList);
//     const { auth } = flags;
//     const environment = await this.readEnvironmentFile();

//     const authConfig = await this.readConfigFromFile(AuthConfig, auth);

//     if (!authConfig) {
//       this.error('Valid auth config file must be supplied');
//     }

//     const service = new ShareService(environment, this.updateStatus);
//     try {
//       const shares = await service.listShares(authConfig);
//       this.printYaml(ShareListConfig.encodeFromResult(shares));
//     } catch (err) {
//       await this.handleException(err);
//     }
//   }
// }

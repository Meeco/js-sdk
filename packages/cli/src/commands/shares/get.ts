// import { ShareService } from '@meeco/sdk';
// import { AuthConfig } from '../../configs/auth-config';
// import { ItemConfig } from '../../configs/item-config';
// import { authFlags } from '../../flags/auth-flags';
// import MeecoCommand from '../../util/meeco-command';

// export default class SharesGet extends MeecoCommand {
//   static description = 'Get the item associated with a share, along with the decrypted values';

//   static flags = {
//     ...MeecoCommand.flags,
//     ...authFlags,
//   };

//   static args = [
//     {
//       name: 'shareId',
//       required: true,
//       description: 'ID of the shared item to fetch',
//     },
//   ];

//   async run() {
//     const { args, flags } = this.parse(this.constructor as typeof SharesGet);

//     const { auth } = flags;
//     const { shareId } = args;
//     const environment = await this.readEnvironmentFile();

//     const authConfig = await this.readConfigFromFile(AuthConfig, auth);

//     if (!authConfig) {
//       this.error('Valid auth config file must be supplied');
//     }

//     const service = new ShareService(environment, this.updateStatus);
//     try {
//       const item = await service.getSharedItem(authConfig, shareId);
//       this.printYaml(ItemConfig.encodeFromJSON(item));
//     } catch (err) {
//       await this.handleException(err);
//     }
//   }
// }

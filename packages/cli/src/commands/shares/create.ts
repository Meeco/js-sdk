// import { ShareService } from '@meeco/sdk';
// import { flags as _flags } from '@oclif/command';
// import { ShareConfig } from '../../configs/share-config';
// import MeecoCommand from '../../util/meeco-command';

// export default class SharesCreate extends MeecoCommand {
//   static description = 'Share an item between two users';

//   static flags = {
//     ...MeecoCommand.flags,
//     config: _flags.string({
//       char: 'c',
//       description: 'Share config file to use for setting up the share',
//       required: true
//     })
//   };

//   static args = [{ name: 'file' }];

//   async run() {
//     const { flags } = this.parse(SharesCreate);
//     const { config } = flags;

//     try {
//       const environment = await this.readEnvironmentFile();
//       const share = await this.readConfigFromFile(ShareConfig, config);

//       if (!share) {
//         this.error('Must specify valid share config file');
//       }

//       const service = new ShareService(environment, this.updateStatus);
//       const result = await service.shareItem(share.from, share.connectionId, share.itemId);
//       this.printYaml(result);
//     } catch (err) {
//       await this.handleException(err);
//     }
//   }
// }

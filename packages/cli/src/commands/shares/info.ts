// import { findConnectionBetween, ShareService } from '@meeco/sdk';
// import { flags as _flags } from '@oclif/command';
// import { ConnectionConfig } from '../../configs/connection-config';
// import MeecoCommand from '../../util/meeco-command';

// export default class SharesInfo extends MeecoCommand {
//   static description = 'View information about the shared encryption space of two users';

//   static flags = {
//     ...MeecoCommand.flags,
//     config: _flags.string({
//       char: 'c',
//       description: 'Connection config file to use getting share information',
//       required: true
//     })
//   };

//   static args = [{ name: 'file' }];

//   async run() {
//     const { flags } = this.parse(SharesInfo);
//     const { config } = flags;

//     try {
//       const environment = await this.readEnvironmentFile();
//       const share = await this.readConfigFromFile(ConnectionConfig, config);

//       if (!share) {
//         this.error('Must specify valid share config file');
//       }

//       const service = new ShareService(environment, this.updateStatus);
//       const { fromUserConnection, toUserConnection } = await findConnectionBetween(
//         share.from,
//         share.to,
//         environment,
//         this.updateStatus
//       );

//       const result = await service.fetchSharedEncryptionSpace(share.from, fromUserConnection);
//       result.to_user_connection_id = toUserConnection.id;
//       this.printYaml(result);
//     } catch (err) {
//       await this.handleException(err);
//     }
//   }
// }

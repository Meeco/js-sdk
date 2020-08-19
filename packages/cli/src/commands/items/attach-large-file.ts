import { ItemService } from '@meeco/sdk';
import { flags as _flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import * as fs from 'fs';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { AuthConfig } from '../../configs/auth-config';
import { FileAttachmentConfig } from '../../configs/file-attachment-config';
import { authFlags } from '../../flags/auth-flags';
import { readFileAsBuffer } from '../../util/file';
import MeecoCommand from '../../util/meeco-command';

export default class ItemsAttachLargeFile extends MeecoCommand {
  static description = 'Encrypt and attach a file to an item';

  static example = `meeco items:attach-file -c ./file-attachment-config.yaml`;

  static flags = {
    ...MeecoCommand.flags,
    ...authFlags,
    config: _flags.string({ char: 'c', required: true, description: 'file attachment config yaml' })
  };

  static args = [];

  async run() {
    const { flags } = this.parse(this.constructor as typeof ItemsAttachLargeFile);
    const environment = await this.readEnvironmentFile();
    const { auth, config } = flags;

    try {
      const authConfig = await this.readConfigFromFile(AuthConfig, auth);
      const fileConfig = await this.readConfigFromFile(FileAttachmentConfig, config);

      if (!authConfig) {
        this.error('Must specify a valid auth config file');
      }
      if (!fileConfig) {
        this.error('Must specify a valid file attachment config');
      }

      const filePath = fileConfig.file;
      let file: Buffer, fileName: string, fileType: string;
      const fileStats = fs.statSync(fileConfig.file);
      try {
        file = await readFileAsBuffer(filePath);
        fileName = basename(filePath);
        fileType = lookup(filePath) || 'application/octet-stream';
      } catch (err) {
        throw new CLIError(
          `Failed to read file '${filePath}' - please check that the file exists and is readable`
        );
      }

      const service = new ItemService(environment, this.updateStatus);
      const uploadUrl = await service.directAttachmentUploadUrl(
        {
          ...fileConfig,
          fileName,
          fileType,
          fileSize: fileStats.size
        },
        authConfig
      );

      const uploadResult = await service.directAttachmentUpload(
        {
          directUploadUrl: uploadUrl.url,
          file: fileConfig.file,
          encrypt: true,
          options: {}
        },
        authConfig
      );

      const artifactsFileName = fileName + '.encryption_artifacts';
      const artifactsFileDir = `./tmp/${artifactsFileName}`;
      fs.writeFileSync(artifactsFileDir, JSON.stringify(uploadResult.artifacts));
      const artifactsFileStats = fs.statSync(fileConfig.file);

      const artifactsUploadUrl = await service.directAttachmentUploadUrl(
        {
          fileName: artifactsFileName,
          fileType: 'application/json',
          fileSize: artifactsFileStats.size
        },
        authConfig
      );

      await service.directAttachmentUpload(
        {
          directUploadUrl: artifactsUploadUrl.url,
          file: artifactsFileDir,
          encrypt: false,
          options: {}
        },
        authConfig
      );

      const attachedDoc = await service.directAttachmentAttach(
        {
          blobId: uploadUrl.blob_id,
          blobKey: uploadUrl.blob_key,
          artifactsBlobId: artifactsUploadUrl.blob_id,
          artifactsBlobKey: artifactsUploadUrl.blob_key
        },
        authConfig
      );

      this.printYaml(attachedDoc);
    } catch (err) {
      await this.handleException(err);
    }
  }
}

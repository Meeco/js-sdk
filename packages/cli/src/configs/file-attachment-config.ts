import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IFileAttachmentConfigTemplate {
  label: string;
  file: string;
}

export interface IFileAttachmentConfigMetadata {
  item_id: string;
}

@ConfigReader<FileAttachmentConfig>()
export class FileAttachmentConfig {
  static kind = 'FileAttachment';

  public readonly label: string;
  public readonly file: string;

  constructor(
    public readonly itemId: string,
    public readonly template: IFileAttachmentConfigTemplate
  ) {
    this.label = template.label;
    this.file = template.file;
  }

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IFileAttachmentConfigMetadata, IFileAttachmentConfigTemplate>
  ): FileAttachmentConfig {
    return new FileAttachmentConfig(yamlConfigObj.metadata!.item_id, yamlConfigObj.spec);
  }
}

import { ConfigReader, IYamlConfig } from './yaml-config';

export interface IThumbnailConfigTemplate {
  file: string;
  sizeType: string;
}

export interface IThumbnailConfigMetadata {
  itemId: string;
  slotId: string;
}

@ConfigReader<ThumbnailConfig>()
export class ThumbnailConfig {
  static kind = 'Thumbnail';

  public readonly file: string;
  public readonly sizeType: string;

  constructor(
    public readonly itemId: string,
    public readonly slotId: string,
    public readonly template: IThumbnailConfigTemplate
  ) {
    this.file = template.file;
    this.sizeType = template.sizeType;
  }

  static fromYamlConfig(
    yamlConfigObj: IYamlConfig<IThumbnailConfigMetadata, IThumbnailConfigTemplate>
  ): ThumbnailConfig {
    return new ThumbnailConfig(
      yamlConfigObj.metadata!.itemId,
      yamlConfigObj.metadata!.slotId,
      yamlConfigObj.spec
    );
  }
}

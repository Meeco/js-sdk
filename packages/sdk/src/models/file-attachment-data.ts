export class FileAttachmentData {
  /**
   * Id of the item to add the attachment to
   */
  public readonly itemId: string;
  /**
   * Label of the slot that the attachment will be added to
   */
  public readonly label: string;
  /**
   * Path to the file to attach
   */
  public readonly file: string;

  constructor(config: { itemId: string; label: string; file: string }) {
    this.itemId = config.itemId;
    this.label = config.label;
    this.file = config.file;
  }
}

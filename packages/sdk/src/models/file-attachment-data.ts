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
   * The file to attach
   */
  public readonly file: Buffer | Uint8Array | ArrayBuffer;
  /**
   * Name to be used for the file
   */
  public readonly fileName: string;
  /**
   * MIME type of the file
   */
  public readonly fileType: string;

  constructor(config: {
    /**
     * Id of the item to add the attachment to
     */
    itemId: string;
    /**
     * Label of the slot that the attachment will be added to
     */
    label: string;
    /**
     * Name to be used for the file
     */
    fileName: string;
    /**
     * MIME type of the file
     */
    fileType: string;
    /**
     * The file to attach
     */
    file: Buffer | Uint8Array | ArrayBuffer;
  }) {
    this.itemId = config.itemId;
    this.label = config.label;
    this.file = config.file;
    this.fileName = config.fileName;
    this.fileType = config.fileType;
  }
}

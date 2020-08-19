export interface IDirectAttachmentUploadResponse {
  artifacts: {
    iv: Buffer[];
    ad: string;
    at: Buffer[];
    encryption_stratergy: string;
    range: string[];
  };
}

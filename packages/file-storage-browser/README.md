# @meeco/file-storage-browser

This file storage code has been seperated out of the main `@meeco/sdk` to keep it smaller.

## Installation

```sh
npm install -S @meeco/file-storage-browser
```

## Basic Usage

### File Upload

```ts
const { attachment, dek } = await fileUploadBrowser({
  file: file,
  vaultUrl: vaultUrl,
  vaultAccessToken: vaultAccessToken,
  subscriptionKey: subscriptionKey,
  videoCodec: videoCodec,
  progressUpdateFunc: (chunkBuffer: ArrayBuffer | null, percentageComplete: number) => {
    // do something with chunkBuffer or percentageComplete
  },
});
```

### File Download

```ts
const downloadedFile = await fileDownloadBrowser({
  attachmentId: attachmentSlot?.attachment_id,
  dek: attachmentSlot?.value,
  vaultUrl,
  vaultAccessToken,
  subscriptionKey,
  progressUpdateFunc: (
    chunkBuffer: ArrayBuffer | null,
    percentageComplete: number,
    videoCodec?: string
  ) => {
    // do something with chunkBuffer, percentageComplete, or videoCodec (e.g. can be used for video streaming)
  },
});
const fileUrl = URL.createObjectURL(downloadedFile);
```

### More detailed usage

Please see the detailed usage in the `demo` project in this repository (specifically `demo/index.ts`)

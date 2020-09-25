# @meeco/file-storage-node

IMPORTANT: there are many improvements and optimisation planned for this package, it is not
recommended to use it except for PoC at this stage.

This file storage code has been seperated out of the main `@meeco/sdk` to keep it smaller.

## Installation

```sh
npm install -S @meeco/file-storage-node
```

## Basic Usage

### File Upload

```ts
const uploadedFile = await largeFileUploadNode(fileConfig.file, environment, {
  data_encryption_key,
  vault_access_token,
});
console.log(uploadedFile);
```

### File Download

```ts
const downloadedFile = await fileDownloadNode(
  attachmentId,
  environment,
  {
    data_encryption_key: authConfig.data_encryption_key.key,
    vault_access_token: authConfig.vault_access_token,
  },
  attachmentSlotValueDek,
  this.updateStatus
);
await fs.writeFileSync(outputPath + downloadedFile.fileName, downloadedFile.buffer);
```

### More detailed usage

Please see the detailed usage in the `cli` project in this repository (specifically
`../cli/src/commands/items/attach-file.ts` and`../cli/src/commands/items/get-attachment.ts`)

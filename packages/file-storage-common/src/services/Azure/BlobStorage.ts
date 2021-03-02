import axios, { CancelToken } from 'axios';

const BLOCK_MAX_SIZE = 1 * 1024 * 1024; // 1MB;

function buildAzureHeaders() {
  return {
    'x-ms-version': '2011-08-18',
    'x-ms-date': new Date().toUTCString(),
  };
}

/**
 * Creates a new block to be committed as part of a blob
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {Uint8Array} data bytes to upload
 * @param {String} blockID block id
 */
async function putBlock(sasUrl: string, data: Uint8Array, blockID: string) {
  const url = `${sasUrl}&comp=block&blockid=${blockID}`;
  return axios({
    method: 'put',
    url,
    headers: {
      ...buildAzureHeaders(),
      'x-ms-blob-type': 'BlockBlob',
    },
    data,
  });
}

/**
 * The Put Block List operation writes a blob by specifying the list of
 * block IDs that make up the blob. In order to be written as part of a blob,
 * a block must have been successfully written to the server in a prior `Put Block` operation.
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {Array<String>} blockIDList array with all blocks ids to commit
 * @param {String} fileType
 */
async function putBlockList(sasUrl: string, blockIDList: string[], fileType: string) {
  const url = `${sasUrl}&comp=blocklist`;
  const idString = blockIDList.map(id => `<Latest>${id}</Latest>`).join('');
  const data = `<?xml version="1.0" encoding="utf-8"?><BlockList>${idString}</BlockList>`;

  return axios({
    method: 'put',
    url,
    headers: {
      ...buildAzureHeaders(),
      'x-ms-blob-content-type': fileType,
      'Content-Type': 'text/xml',
    },
    data,
  });
}

/**
 * Get existing Blob Block Chunk
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {String} range range in bytes e.g 0-255
 */
async function getBlock(
  sasUrl: any,
  range?: string,
  authHeaders?: { [index: string]: string },
  cancelToken?: CancelToken
) {
  const url = `${sasUrl}`;
  const headers = {};
  if (range) {
    headers['x-ms-range'] = range;
    headers['Range'] = range;
  }

  if (authHeaders) {
    Object.assign(headers, authHeaders);
  }

  return axios({
    method: 'get',
    url,
    headers,
    responseType: 'arraybuffer',
    cancelToken,
  });
}

/**
 * Get existing Blob Properties
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 */
async function getBlobProperties(sasUrl: string) {
  const url = `${sasUrl}`;
  return axios({
    method: 'head',
    url,
  });
}

export default {
  BLOCK_MAX_SIZE,
  putBlock,
  putBlockList,
  getBlock,
  getBlobProperties,
};

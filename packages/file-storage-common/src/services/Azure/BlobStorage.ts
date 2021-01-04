import axios, { CancelToken } from 'axios';

const BLOCK_MAX_SIZE = 1 * 1024 * 1024; // 1MB;

const buildAzureHeaders = () => ({
  'x-ms-version': '2011-08-18',
  'x-ms-date': new Date().toUTCString(),
});

/**
 * Creates a new block to be committed as part of a blob
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {Uint8Array} data bytes to upload
 * @param {String} blockID block id
 */
const putBlock = async (sasUrl, data, blockID) => {
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
};

/**
 * The Put Block List operation writes a blob by specifying the list of
 * block IDs that make up the blob. In order to be written as part of a blob,
 * a block must have been successfully written to the server in a prior `Put Block` operation.
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {Array<String>} blockIDList array with all blocks ids to commit
 * @param {String} fileType
 */
const putBlockList = async (sasUrl, blockIDList, fileType) => {
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
};

/**
 * Get existing Blob Block Chunk
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 * @param {String} range range in bytes e.g 0-255
 */
const getBlock = async (sasUrl: any, range: any, cancelToken?: CancelToken) => {
  const url = `${sasUrl}`;
  const headers = range ? { 'x-ms-range': range, Range: range } : {};
  return axios({
    method: 'get',
    url,
    headers,
    responseType: 'arraybuffer',
    cancelToken: cancelToken,
  }).then(result => {
    return result;
  });
};

/**
 * Get existing Blob Properties
 * @param {String} sasUrl azure blob storage endpoint with sas auth
 */
const getBlobProperties = async sasUrl => {
  const url = `${sasUrl}`;
  return axios({
    method: 'head',
    url,
  });
};

export default {
  BLOCK_MAX_SIZE,
  putBlock,
  putBlockList,
  getBlock,
  getBlobProperties,
};

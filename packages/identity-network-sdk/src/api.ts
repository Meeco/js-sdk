import axios from 'axios';

interface Config {
  baseUrl: string;
}

export function resolve(did: string, config: Config) {
  return axios.get(`${config.baseUrl}/v1/did/${did}`).then((res) => res.data);
}

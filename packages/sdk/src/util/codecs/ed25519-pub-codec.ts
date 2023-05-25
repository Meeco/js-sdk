import { BlockCodec } from 'multiformats/codecs/interface';
import { BaseCodec } from './base-codec';

/**
 * Ed25519PubCodec MULTICODEC(public-key-type, raw-public-key-bytes)
 * https://github.com/multiformats/js-multiformats#multicodec-encoders--decoders--codecs
 * Implementation of BlockCodec interface which implements both BlockEncoder and BlockDecoder.
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */

export class Ed25519PubCodec extends BaseCodec implements BlockCodec<number, Uint8Array> {
  // values retrieved from https://raw.githubusercontent.com/multiformats/multicodec/master/table.csv
  name = 'ed25519-pub';
  code = 0xed;
}

import { ByteView } from 'multiformats/codecs/interface';
import * as varint from 'varint';

export abstract class BaseCodec {
  // values retrieved from https://raw.githubusercontent.com/multiformats/multicodec/master/table.csv
  abstract name: string;
  abstract code: number;

  encode(data: Uint8Array): ByteView<Uint8Array> {
    const prefix = this.varintEncode(this.code);
    return this.concat([prefix, data], prefix.length + data.length);
  }
  decode(bytes: ByteView<Uint8Array>): Uint8Array {
    return this.rmPrefix(bytes);
  }

  /**
   * Returns a new Uint8Array created by concatenating the passed ArrayLikes
   *
   * @param {Array<ArrayLike<number>>} arrays
   * @param {number} [length]
   */
  protected concat(arrays: ArrayLike<number>[], length: number) {
    if (!length) {
      length = arrays.reduce((acc, curr) => acc + curr.length, 0);
    }

    const output = new Uint8Array(length);
    let offset = 0;

    for (const arr of arrays) {
      output.set(arr, offset);
      offset += arr.length;
    }

    return output;
  }

  /**
   * @param {number} num
   */
  protected varintEncode(num: number) {
    return Uint8Array.from(varint.encode(num));
  }

  /**
   * Decapsulate the multicodec-packed prefix from the data.
   *
   * @param {Uint8Array} data
   * @returns {Uint8Array}
   */
  protected rmPrefix(data: Uint8Array): Uint8Array {
    varint.decode(/** @type {Buffer} */ data);
    return data.slice(varint.decode.bytes);
  }
}

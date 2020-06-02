import * as cryppo from '@meeco/cryppo';

/**
 * Mockable cryppo
 *
 * ES6 module imports can not be stubbed with certain cobinations of TypeScript/sinon/etc.
 * https://github.com/sinonjs/sinon/issues/1711
 *
 * By having an intermediate module we can use `sinon.stub` to mock cryppo methods in tests
 */
export default (<typeof cryppo>{
  ...cryppo
}) as typeof cryppo;

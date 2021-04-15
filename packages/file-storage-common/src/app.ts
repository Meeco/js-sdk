// eslint-disable-next-line import/prefer-default-export
export const isRunningOnWeb = typeof FileReader === 'function';

/**
 * Injects a function that can be used to cancel a long running download/upload.
 * Argument function "f" must have named param "cancel".
 */
export function withCancel<S, T>(
  f: (_: S & { cancel?: Promise<any> }) => T
): (_: S) => { cancel: () => void; success: T } {
  return (x: S) => {
    let cancelFn;
    const promise = new Promise((resolve, reject) => (cancelFn = () => resolve('cancel')));
    return {
      cancel: cancelFn,
      success: f({
        ...x,
        cancel: promise,
      }),
    };
  };
}

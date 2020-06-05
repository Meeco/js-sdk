// tslint:disable-next-line: no-var-requires
const FormData = require('form-data');

/**
 * This exists because of what appears to be an issue in the generated SDK.
 * Attaching a `Buffer()` to `FormData` does not work if the file name property isn't provided
 * (which it isn't in the generated code).
 * This monkey-patches the constructor of FormData to ensure the argument always exists
 */
class SDKFormData extends FormData {
  append(...args) {
    if (args[0] === 'attachment[file]' || args[0] === 'binary[file]') {
      return super.append(args[0], args[1], 'file');
    }

    return super.append(...args);
  }
}

// We might be able to assume an existing window.FormData works
// const _global = this;
export default SDKFormData;

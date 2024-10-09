import FormData from 'form-data';

/**
 * @hidden
 *
 * This exists because of what appears to be an issue in the generated SDK.
 * Attaching a `Buffer()` to `FormData` does not work if the file name property isn't provided
 * (which it isn't in the generated code).
 * This monkey-patches the constructor of FormData to ensure the argument always exists
 */
class SDKFormData extends FormData {
  append(key: string, value: any, options?: FormData.AppendOptions | string) {
    if (key === 'attachment[file]' || key === 'binary[file]') {
      return super.append(key, value, 'file');
    }

    return super.append(key, value, options);
  }
}

// We might be able to assume an existing window.FormData works
// const _global = this;
export default SDKFormData;

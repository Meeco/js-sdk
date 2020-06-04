// tslint:disable-next-line: no-var-requires
const FormData = require('form-data');

export class SDKFormData extends FormData {
  append(...args) {
    if (args[0] === 'attachment[file]' || args[0] === 'binary[file]') {
      return super.append(args[0], args[1], 'file');
    }

    return super.append(...args);
  }
}

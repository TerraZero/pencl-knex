const PenclRuntimeError = require('pencl-kit/src/Error/Runtime/PenclRuntimeError');

module.exports = class KnexError extends PenclRuntimeError {

  static view(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

}
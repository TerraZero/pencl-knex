const PenclError = require('pencl-kit/src/Error/PenclError');

module.exports = class KnexError extends PenclError {

  static view(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

}
const StorageError = require('./StorageError');

module.exports = class FieldError extends StorageError {

  /**
   * @param {string} message 
   * @param {import('../FieldType/FieldTypeBase')} field 
   * @param {*} value 
   */
  constructor(message, field, value) {
    super('[' + field.constructor.name + '] ' + message + ': VALUE: ' + StorageError.view(value));
    this.field = field;
    this.value = value;
  }

}
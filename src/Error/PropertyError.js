const StorageError = require('./StorageError');

module.exports = class PropertyError extends StorageError {

  /**
   * @param {string} message 
   * @param {import('../PropertyType/PropertyBase')} property 
   * @param {*} value 
   */
  constructor(message, property, value) {
    super('[' + property.constructor.name + '] ' + message + ': VALUE: ' + StorageError.view(value));
    this.property = property;
    this.value = value;
  }

}
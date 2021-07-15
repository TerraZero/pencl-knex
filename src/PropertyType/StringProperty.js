const PropertyError = require('../Error/PropertyError');
const PropertyBase = require('./PropertyBase');

module.exports = class StringProperty extends PropertyBase {

  /** @returns {string} */
  static get type() {
    return 'string';
  }

  /**
   * @param {StringProperty} property
   * @param {import('knex')} table
   */
  static dbCreateField(property, table) {
    table.string(property.dbField, property.length());
  }

  /**
   * @param {(int|null)} length 
   * @returns {(this|int)}
   */
  length(length = null) {
    if (length === null) return this.config.length;
    this.config.length = length;
    return this;
  }

  validate(value) {
    if (typeof value === 'object') {
      throw new PropertyError('Value must be of type string or scalar', this, value);
    }
    return true;
  }

  transform(value) {
    return value + '';
  }

}
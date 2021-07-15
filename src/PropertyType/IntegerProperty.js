const PropertyError = require('../Error/PropertyError');
const PropertyBase = require('./PropertyBase');

module.exports = class IntegerProperty extends PropertyBase {

  /** @returns {string} */
  static type() {
    return 'integer';
  }

  /**
   * @param {IntegerProperty} property
   * @param {import('knex')} table
   */
  static dbCreateField(property, table) {
    table.integer(property.dbField);
  }

  validate(value) {
    if (value + '' !== parseInt(value) + '') {
      throw new PropertyError('Value must be of type int or scalar', this, value);
    }
    return true;
  }

  transform(value) {
    return parseInt(value + '');
  }

}
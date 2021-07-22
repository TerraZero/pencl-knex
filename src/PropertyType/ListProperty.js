const PropertyError = require('../Error/PropertyError');
const SchemaError = require('../Error/SchemaError');
const StringProperty = require('./StringProperty');

module.exports = class ListProperty extends StringProperty {

  /** @returns {string} */
  static get type() {
    return 'list';
  }

  /**
   * @param {StringProperty} property
   * @param {import('knex')} table
   */
  static dbCreateField(property, table) {
    if (!property.list()) throw new SchemaError('ListProperty must defined a list of values.', this, property);
    super.dbCreateField(property, table);
  }

  /**
   * @param {ListProperty} property
   */
  static getForm(property) {
    return {
      list: {
        type: 'string',
        label: 'List',
        item_label: 'Item [count]',
      },
    };
  }

  /**
   * @param {(string[]|null)} list
   * @returns {(this|string[])}
   */
  list(list = null) {
    if (list === null) return this.config.list;
    this.config.list = list;
    let length = 0;
    for (const value of list) {
      length = length < value.length ? value.length : length;
    }
    this.length(length);
    return this;
  }

  validate(value) {
    super.validate(value);
    if (!this.list().includes(value)) {
      throw new PropertyError('Value must be one of these ' + JSON.stringify(this.list()), this, value);
    }
    return true;
  }

}
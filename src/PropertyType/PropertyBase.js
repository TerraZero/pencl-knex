const PenclMethodDefinitionError = require('pencl-kit/src/Error/PenclMethodDefinitionError');
const SchemaError = require('../Error/SchemaError');

module.exports = class PropertyBase {

  /**
   * @param {string} name 
   * @param {Object} config
   * @returns {new this}
   */
  static create(name, config = {}) {
    return new this(name, config);
  }

  /**
   * @param {PropertyBase} property
   * @param {import('knex')} table
   */
  static dbCreateField(property, table) {
    throw new PenclMethodDefinitionError(this, 'dbCreateField');
  }

  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this._dbField = name;
  }

  get dbField() {
    return this._dbField;
  }

  /** @returns {typeof PropertyBase} */
  get definition() {
    return this.constructor;
  }

  setDBField(field) {
    this._dbField = field;
    return this;
  }

  /**
   * @param {import('knex')} table
   */
  dbCreateField(table) {
    this.definition.dbCreateField(this, table);
  }

  transform(value) {
    return value;
  }

  validate(value) {
    return true;
  }

}
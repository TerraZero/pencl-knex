const PenclGetterDefinitionError = require('pencl-kit/src/Error/Definition/PenclGetterDefinitionError');
const PenclMethodDefinitionError = require('pencl-kit/src/Error/Definition/PenclMethodDefinitionError');

module.exports = class PropertyBase {

  /** @returns {string} */
  static get type() {
    throw new PenclGetterDefinitionError(this, 'type');
  }

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
   * @param {import('knex').Knex.TableBuilder} table
   */
  static dbCreateField(property, table) {
    throw new PenclMethodDefinitionError(this, 'dbCreateField');
  }

  /**
   * @param {PropertyBase} property
   */
  static getForm(property) {
    throw new PenclMethodDefinitionError(this, 'getForm');
  }

  /**
   * @param {string} name 
   * @param {Object} config 
   */
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this._dbField = name;
  }

  /** @returns {string} */
  get type() {
    return this.definition.type;
  }

  /** @returns {string} */
  get dbField() {
    return this._dbField;
  }

  /** @returns {typeof PropertyBase} */
  get definition() {
    return this.constructor;
  }

  /**
   * @param {string} field 
   * @returns {this}
   */
  setDBField(field) {
    this._dbField = field;
    return this;
  }

  /**
   * @param {import('knex').Knex.TableBuilder} table
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
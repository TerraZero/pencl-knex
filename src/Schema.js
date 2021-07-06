const Reflection = require('pencl-kit/src/Util/Reflection');
const Regex = require('pencl-kit/src/Util/Regex');

module.exports = class Schema {

  /**
   * @param {Object} schema 
   */
  constructor(schema) {
    this.schema = schema;
  }

  /** @returns {string} */
  get type() {
    return this.get('_type');
  }

  /** @returns {string} */
  get name() {
    return this.get('_name');
  }

  get placeholders() {
    const placeholders = {};
    for (const field in this.schema) {
      if (typeof this.schema[field] !== 'object') {
        placeholders[Regex.escape('[' + field + ']')] = this.schema[field];
      }
    }
    return placeholders;
  }

  /**
   * @param {string} name 
   * @param {*} fallback 
   * @returns {*}
   */
  get(name, fallback = null) {
    return Reflection.getDeep(this.schema, name, fallback);
  }

  /**
   * @param {string} name 
   * @param {*} value 
   */
  set(name, value) {
    Reflection.setDeep(this.schema, name, value);
  }

}
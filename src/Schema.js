module.exports = class Schema {

  /**
   * @param {string} file 
   * @param {string} name 
   * @param {Object} schema 
   */
  constructor(file, name, schema) {
    this.file = file;
    this.name = name;
    this.schema = schema;
  }

}
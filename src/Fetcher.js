const Reflection = require('pencl-kit/src/Util/Reflection');

module.exports = class Fetcher {

  /**
   * @param {Object[]} result 
   */
  constructor(result) {
    this.result = result;
  }

  /**
   * @param {string} deepfield
   * @returns {any[]}
   */
  getFields(deepfield) {
    const field = [];
    for (const row of this.result) {
      field.push(Reflection.getDeep(row, deepfield, undefined));
    }
    return field.filter((v) => v !== undefined);
  }

}
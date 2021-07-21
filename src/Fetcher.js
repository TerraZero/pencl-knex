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
    const data = [];

    for (const row of this.result) {
      data.push(Reflection.getDeep(row, deepfield, undefined));
    }
    return data.filter((v) => v !== undefined);
  }

  /**
   * @param  {Object<string, string>} deepfields 
   * @param {any} fallback
   */
  extract(deepfields, fallback = null) {
    const data = [];

    for (const row of this.result) {
      const extract = {};

      for (const deepfield in deepfields) {
        extract[deepfields[deepfield]] = Reflection.getDeep(row, deepfield, fallback);
      }
      data.push(extract);
    }
    return data;
  }

  /**
   * @param {string} field 
   * @param {Object<string, string>} deepfields 
   * @param {any} fallback
   * @returns {Object}
   */
  mapField(field, deepfields, fallback = null) {
    const data = {};

    for (const row of this.result) {
      const extract = {};

      for (const deepfield in deepfields) {
        extract[deepfields[deepfield]] = Reflection.getDeep(row, deepfield, fallback);
      }
      data[extract[field]] = extract;
    }
    return data;
  }

}

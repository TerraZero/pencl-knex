/**
 * @typedef {Object<string, T_FormItem>} T_Form
 */

/**
 * @typedef {Object} T_FormItem
 * @property {string} type
 * @property {string} [label]
 * @property {(string|string[])} [description]
 * @property {number} [cardinality]
 * @property {T_FormMask[]} [mask]
 * @property {boolean} [disabled]
 * @property {T_FormRequire} [require]
 * @property {string} [mount]
 * @property {T_Form} [form]
 * @property {number} [min]
 * @property {number} [max]
 * @property {any} [fallback]
 * @property {boolean} [open]
 * @property {(number|string)} [grid]
 */

/**
 * @typedef {Object} T_FormRequire
 * @property {string} mode
 */

/**
 * @typedef {Object} T_FormMask
 * @property {string} regex
 * @property {string} replace
 */

/**
 * @typedef {Object} T_FormConfig
 * @property {string} [mode]
 */

/**
 * @typedef {Object} T_EntityData
 * @property {int} [id]
 * @property {string} [label]
 * @property {Object<string, T_FieldInstanceData>} [fields]
 */

/**
 * @typedef {Object} T_FieldInstanceData
 * @property {string} [label]
 */

module.exports = class FormDefinition {

  /** @returns {T_FormMask[]} */
  static get MASK_ID() {
    return [
      {
        regex: '([^a-z]+)',
        replace: '_',
      }
    ];
  }

}
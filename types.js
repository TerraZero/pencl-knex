/**
 * @typedef {Object<string, T_FormItem>} T_Form
 */

/**
 * @typedef {Object} T_FormItem
 * @property {string} type =['group', 'text', 'number', 'select', 'radio', 'checkbox']
 * @property {string} [component]
 * @property {number} [cardinality]
 * @property {any} [fallback]
 * @property {string} [label]
 * @property {(string|string[])} [description]
 * @property {(number|string)} [igrid]
 * @property {number} [span]
 * @property {boolean} [disabled]
 * @property {string} [placeholder]
 * @property {Object} [require]
 * @property {string} [require.mode]
 * @property {boolean} [open] type='group'
 * @property {(number|string)} [grid] type='group'
 * @property {T_Form} [form] type='group'
 * @property {T_FormMask[]} [mask] type='text'
 * @property {number} [min] type='number'
 * @property {number} [max] type='number'
 * @property {number} [step] type='number'
 * @property {number} [precision] type='number'
 * @property {Object<string, string>} [options] type=['select', 'radio']
 * @property {boolean} [multiple] type='select'
 * @property {boolean} [border] type='checkbox'
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
 * @property {number} [id]
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
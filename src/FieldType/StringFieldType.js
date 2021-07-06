const StringProperty = require('../PropertyType/StringProperty');
const FieldTypeBase = require('./FieldTypeBase');

module.exports = class StringFieldType extends FieldTypeBase {

  static get type() {
    return 'string';
  }

  static defaultConfig() {
    const config = super.defaultConfig();

    config.length = 255;
    return config;
  }

  static defaultInstanceConfig() {
    const config = super.defaultInstanceConfig();

    config.trim = null;
    return config;
  }

  /**
   * @param {FieldTypeBase} field
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(field, props) {
    props.value = StringProperty.create('value').length(field.fieldconfig.length);
  }

  /**
   * @param {StringFieldType} field 
   * @param {string} property
   * @param {*} value
   * @returns {*}
   */
  static validate(field, property, value) {
    if (property === 'value') {
      if (field.props.value.validate(value) && field.fieldconfig.length < value.length) {
        value = value.substring(0, field.fieldconfig.length - (field.config.trim || '').length) + (field.config.trim || '');
      }
    } else {
      super.validate(field, property, value);
    }
    return value;
  }

}
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
   * @param {import('../Schema')} fieldschema
   * @param {Object<string, import('../PropertyType/PropertyBase')>} props
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(fieldschema, props) {
    props.value = StringProperty.create('value').length(fieldschema.get('config').length);
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

  /**
   * @param {import('../../types').T_Form} form
   * @param {Object} config
   */
  static formSchemaField(form, config) {
    super.formSchemaField(form, config);
    form.length = {
      type: 'number',
      min: 1,
      label: 'String Length',
      fallback: 255,
      require: {
        mode: 'init',
      },
    };
  }

  /**
   * @param {import('../../types').T_Form} form
   * @param {Object} config
   */
  static formInstanceField(form, config) {
    super.formInstanceField(form, config);
    form.trim = {
      type: 'string',
      label: 'Trim',
      description: 'Trim to much text with this string.',
      fallback: ' ...',
    };
  }

}
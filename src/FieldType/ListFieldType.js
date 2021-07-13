const FieldError = require('../Error/FieldError');
const StringProperty = require('../PropertyType/StringProperty');
const StringFieldType = require('./StringFieldType');

module.exports = class ListFieldType extends StringFieldType {

  static get type() {
    return 'list';
  }

  static defaultConfig() {
    const config = super.defaultConfig();

    config.length = 255;
    return config;
  }

  static defaultInstanceConfig() {
    const config = super.defaultInstanceConfig();

    config.list = [];
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
      if (field.props.value.validate(value) && !field.config.list.includes(value)) {
        throw new FieldError('The value must be one of these ' + JSON.stringify(field.config.list), field, value);
      }
    } else {
      super.validate(field, property, value);
    }
    return value;
  }

}
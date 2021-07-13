const Entity = require('../Entity');
const FieldError = require('../Error/FieldError');
const IntegerProperty = require('../PropertyType/IntegerProperty');
const StringProperty = require('../PropertyType/StringProperty');
const FieldTypeBase = require('./FieldTypeBase');

module.exports = class ReferenceFieldType extends FieldTypeBase {

  static get type() {
    return 'reference';
  }

  static get defaultProperty() {
    return 'id';
  }

  static defaultInstanceConfig() {
    const config = super.defaultInstanceConfig();

    config.fallback_entity = null;
    config.allowed_entities = [];
    return config;
  }

  /**
   * @param {import('../Schema')} fieldschema
   * @param {Object<string, import('../PropertyType/PropertyBase')>} props
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(fieldschema, props) {
    props.entity = StringProperty.create('entity').setDBField('ref_entity').length(255);
    props.id = IntegerProperty.create('id').setDBField('ref_id');
  }

  set(value, data, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (data instanceof Entity) {
      if (this.config.allowed_entities.length && !this.config.allowed_entities.includes(data.schema.entity)) {
        throw new FieldError('Entity type "' + data.schema.entity + '" is not allowed', this, data);
      }
      value.entity = this.props.entity.transform(data.schema.entity);
      value.id = this.props.id.transform(data.id);
    } else if (data.id && data.entity) {
      this.props.entity.validate(data.entity);
      this.props.id.validate(data.id);

      if (this.config.allowed_entities.length && !this.config.allowed_entities.includes(data.entity)) {
        throw new FieldError('Entity type "' + data.entity + '" is not allowed', this, data);
      }

      value.entity = this.props.entity.transform(data.entity);
      value.id = this.props.entity.transform(data.id);
    } else {
      this.props.id.validate(data);
      if (typeof this.config.fallback_entity !== 'string') {
        throw new FieldError('Can not set "id" if no "fallback_entity" is givin.', this, data);
      }
      value.entity = this.props.entity.transform(this.config.fallback_entity);
      value.id = this.props.id.transform(data);
    }
    return value;
  }

}
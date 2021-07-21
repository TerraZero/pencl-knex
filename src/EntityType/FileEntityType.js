const EntityTypeBase = require('./EntityTypeBase');
const StringProperty = require('../PropertyType/StringProperty');
const IntegerProperty = require('../PropertyType/IntegerProperty');

module.exports = class FileEntityType extends EntityTypeBase {

  static get type() {
    return 'file';
  }

  static get label() {
    return 'File';
  }

  static defaultConfig() {
    return {};
  }

  /**
   * @param {EntityTypeBase} entity
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(entity, props) {
    props.label = StringProperty.create('label').length(1024);
    props.name = StringProperty.create('name').length(255);
    props.path = StringProperty.create('path').length(1024);
    props.status = IntegerProperty.create('status');
  }

}
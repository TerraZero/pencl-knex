const EntityTypeBase = require('pencl-knex/src/EntityType/EntityTypeBase');
const StringProperty = require('pencl-knex/src/PropertyType/StringProperty');
const IntegerProperty = require('pencl-knex/src/PropertyType/IntegerProperty');

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
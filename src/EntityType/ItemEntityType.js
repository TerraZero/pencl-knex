const EntityTypeBase = require('./EntityTypeBase');

module.exports = class ItemEntityType extends EntityTypeBase {

  static get type() {
    return 'item';
  }

  static defaultConfig() {
    return {};
  }

}
const EntityTypeBase = require('./EntityTypeBase');

module.exports = class ItemEntityType extends EntityTypeBase {

  static get type() {
    return 'item';
  }

  static get label() {
    return 'Item';
  }

  static defaultConfig() {
    return {};
  }

}
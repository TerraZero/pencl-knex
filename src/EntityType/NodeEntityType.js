const EntityTypeBase = require('./EntityTypeBase');

module.exports = class NodeEntityType extends EntityTypeBase {

  static get type() {
    return 'node';
  }

  static get label() {
    return 'Node';
  }

  static defaultConfig() {
    return {};
  }

}
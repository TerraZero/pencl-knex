const StorageError = require('./StorageError');

module.exports = class EntityError extends StorageError {

  /**
   * @param {string} message 
   * @param {import('../Entity')} entity 
   */
  constructor(message, entity) {
    super('[' + entity.schema.entity + ':' + entity.schema.bundle + ':' + entity.id + '] ' + message);
    this.entity = entity;
  }

}
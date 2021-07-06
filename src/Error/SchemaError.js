const KnexError = require('./KnexError');

module.exports = class SchemaError extends KnexError {

  constructor(message, schema, instance = null) {
    super('[' + schema.name + '] ' + message);
  }

}
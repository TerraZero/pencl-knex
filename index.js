const PenclKnex = require('./src/PenclKnex');

/**
 * @returns {PenclKnex}
 */
module.exports = function() {
  if (this._pencl_knex === undefined) {
    this._pencl_knex = new PenclKnex();
  }
  return this._pencl_knex;
}
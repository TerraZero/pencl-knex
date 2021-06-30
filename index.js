const Knex = require('knex');
const PenclPlugin = require('pencl-core/src/Boot/PenclPlugin');

class PenclKnex extends PenclPlugin {

  get name() {
    return 'knex';
  }

  get config() {
    return {
      data: null,
      env: 'development',
      file: '~/knexfile.js',
    };
  }

  constructor() {
    super();
    this._connections = {};
    this._env = this.config.env;

    this.config.data = require(this.boot.getPath(this.config.file));
  }

  /** @returns {Knex} */
  connection(env = null) {
    env = env || this._env;
    if (!this._connections[env]) {
      this._connections[env] = Knex(this.config.data[env]);
    }
    return this._connections[env];
  }

}

module.exports = function() {
  if (this._pencl_knex === undefined) {
    this._pencl_knex = new PenclKnex();
  }
  return this._pencl_knex;
}
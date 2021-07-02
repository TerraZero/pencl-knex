const Knex = require('knex');

const PenclPlugin = require('pencl-core/src/Boot/PenclPlugin');

module.exports = class PenclKnex extends PenclPlugin {

  get name() {
    return 'knex';
  }

  get config() {
    return {
      data: null,
      env: 'development',
      file: '~/knexfile.js',
      schema: '~/schema',
      schemapattern: '**/schema.*.json',
      schemas: {
        entity: 'entity/schema.[entity].[bundle].json',
        field: 'fields/schema.[field].json',
      },
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

  /**
   * @param {string} env 
   * @returns {string} old env
   */
  setEnv(env) {
    const old = this._env;

    this._env = env;
    return old;
  }

  execute(env, callback) {
    const old = this.setEnv(env);
    const answer = callback();
    
    this.setEnv(old);
    return answer;
  }

  /**
   * @param {string} table 
   * @param {int} id 
   * @param {string[]} fields
   */
  async load(table, id, fields = []) {
    
  }

}
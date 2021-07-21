const Knex = require('knex');

const PenclPlugin = require('pencl-core/src/Boot/PenclPlugin');
const Fetcher = require('./Fetcher');
const SchemaManager = require('./SchemaManager');
const Storage = require('./Storage');

module.exports = class PenclKnex extends PenclPlugin {

  get name() {
    return 'knex';
  }

  get config() {
    return {
      data: null,
      env: 'development',
      file: '~/knexfile.js',
      schema: {
        path: '~/schema',
        pattern: '**/schema.*.json',
        types: {
          entity: 'entity/schema.entity.[entity].[bundle].json',
          field: 'fields/schema.field.[field].json',
        },
      },
    };
  }

  constructor() {
    super();
    this._connections = {};
    this._env = this.config.env;
    this._schemas = null;
    this._storage = new Storage(this);

    this.config.data = require(this.boot.getPath(this.config.file));
  }

  /** @type {SchemaManager} */
  get schemas() {
    if (this._schemas === null) {
      this._schemas = new SchemaManager(this);
      this._schemas.addEntityType(require('./EntityType/NodeEntityType'));
      this._schemas.addEntityType(require('./EntityType/ItemEntityType'));
      this._schemas.addEntityType(require('./EntityType/FileEntityType'));
      this._schemas.addFieldType(require('./FieldType/StringFieldType'));
      this._schemas.addFieldType(require('./FieldType/ReferenceFieldType'));
      this.boot.triggerSync('knex.init.schema', this, this._schemas);
    }
    return this._schemas;
  }

  /** @returns {Storage} */
  get storage() {
    return this._storage;
  }

  /** 
   * @param {string} env
   * @returns {import('knex').Knex.QueryBuilder} 
   */
  connection(env = null) {
    env = env || this._env;
    if (!this._connections[env]) {
      this._connections[env] = Knex(this.config.data[env]);
    }
    return this._connections[env];
  }

  /**
   * @callback CB_QueryFactory
   * @param {import('knex').Knex.QueryBuilder} connection
   * @returns {Promise}
   */

  /**
   * @param {CB_QueryFactory} factory 
   * @param {string} env
   * @returns {Fetcher}
   */
  async query(factory, env = null) {
    return new Fetcher(await factory(this.connection(env)));
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

  /**
   * @param {string} env 
   * @param {CallableFunction} callback 
   * @returns 
   */
  execute(env, callback) {
    const old = this.setEnv(env);
    const answer = callback();
    this.setEnv(old);
    return answer;
  }

} 

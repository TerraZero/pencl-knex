const Entity = require('./Entity');
const StorageError = require('./Error/StorageError');
const Fetcher = require('./Fetcher');

module.exports = class Storage {

  static get LOADALLFIELDS() {
    return '[all]';
  }

  /**
   * @param {import('./PenclKnex')} plugin 
   */
  constructor(plugin) {
    this.plugin = plugin;
    this._entities = {};
  }

  get LOADALLFIELDS() {
    return this.constructor.LOADALLFIELDS;
  }

  /**
   * @param {string} entity 
   * @param {string} bundle 
   * @param {Entity.T_entitydata} data
   * @returns {Entity}
   */
  create(entity, bundle, data = null) {
    const schema = this.plugin.schemas.getEntity(entity, bundle);

    return (new Entity(this.plugin, schema)).setData(data);
  }

  /**
   * @param {string} entity 
   * @param {int} id 
   * @returns {this}
   */
  flush(entity, id) {
    delete this._entities[entity][id];
    return this;
  }

  /**
   * @param {string} entity
   * @param {string} bundle
   * @param {Object<string, (string|int|boolean)>} conditions 
   * @returns {int[]}
   */
  async find(entity, bundle, conditions) {
    const type = this.plugin.schemas.getEntity(entity, bundle);
    const select = this.plugin.connection().select(type.table + '.id').from(type.table);

    for (const field in conditions) {
      if (field.startsWith('field.')) {
        const [ key, name, prop ] = field.split('.');
        const fieldtype = type.getField(name);

        const table = {};
        table['field_' + name] = fieldtype.table;
        const on = {};
        on[type.table + '.entity'] = 'field_' + name + '.entity';
        on[type.table + '.id'] = 'field_' + name + '.id';

        select.leftJoin(table, on);
        select.where('field_' + name + '.' + prop, '=', conditions[field]);
      } else {
        select.where(field, '=', conditions[field]);
      }
    }
    const fetcher = new Fetcher(await select);
    return fetcher.getFields('id');
  }

  /**
   * @param {string} entity 
   * @param {int[]} ids 
   * @param  {...string} fields 
   * @returns {Entity[]}
   */
  async loadMultiple(entity, ids = null, ...fields) {
    const loads = [];

    if (ids === null) {
      const type = this.plugin.schemas.getEntityType(entity);

      const fetcher = new Fetcher(await this.plugin.connection().select('id').from(type.table));
      ids = fetcher.getFields('id');
    }

    for (const id of ids) {
      loads.push(await this.load(entity, id, ...fields));
    }
    return loads;
  }

  /**
   * @param {string} entity 
   * @param {int} id 
   * @param {...string} fields
   * @returns {Entity}
   */
  async load(entity, id, ...fields) {
    this._entities[entity] = this._entities[entity] || {};
    if (this._entities[entity][id] === undefined) {
      const type = this.plugin.schemas.getEntityType(entity);

      const data = await this.plugin.connection().select().from(type.table).where('id', id);
      if (data.length === 0) {
        this._entities[entity][id] = null;
        return null;
      } else {
        this._entities[entity][id] = new Entity(this.plugin, this.plugin.schemas.getEntity(data[0].entity, data[0].bundle), data[0]);
      }

      await this.loadFields(this._entities[entity][id], ...fields);
    }
    return this._entities[entity][id];
  }

  /**
   * @param {Entity} entity 
   * @param  {...string} fields 
   * @returns {Entity}
   */
  async loadFields(entity, ...fields) {
    if (fields[0] === Storage.LOADALLFIELDS) fields = entity.getFields();
    for (const field of fields) {
      if (entity.isLoaded(field)) continue;
      const fieldschema = this.plugin.schemas.getField(entity.schema.entity, entity.schema.bundle, field);
      const fielddata = await this.plugin.connection()
        .select()
        .from(fieldschema.table)
        .where('entity', entity.schema.entity)
        .where('id', entity.id)
        .orderBy('delta');
      
      let delta = 0;
      for (const row in fielddata) {
        const value = fieldschema.definition.dbRowLoad(entity, fieldschema, {}, row, fielddata[row]);

        try {
          entity.set(field, value, delta++, null);
        } catch (e) {
          if (e instanceof StorageError) {
            // ignore StorageError by loading
            console.debug('IGNORED: ' + e);
          } else {
            throw e;
          }
        }
      }
      entity.setLoaded(field);
    }
    return entity;
  }

  /**
   * @param {Entity} entity
   * @returns {Entity}
   */
  async save(entity) {
    return this.plugin.connection()(entity.schema.table)
      .insert(entity.schema.definition.dbRow(entity))
      .onConflict('id')
      .merge()
      .then((ids) => {
        if (ids[0] !== 0 && entity.isNew()) {
          entity.set('id', ids[0]);
          this._entities[entity.schema.entity] = this._entities[entity.schema.entity] || {};
          this._entities[entity.schema.entity][entity.id] = entity;
        }
        return this.saveFields(entity);
      });
  }

  /**
   * @param {Entity} entity
   * @returns {Entity}
   */
  async saveFields(entity) {
    for (const field of entity._loadedFields) {
      const fieldschema = entity.schema.getField(field);

      await this.plugin.connection()(fieldschema.table)
        .where('entity', entity.schema.entity)
        .where('id', entity.id)
        .del();

      const rows = fieldschema.definition.dbRow(entity, fieldschema);

      if (rows.length) {
        await this.plugin.connection()(fieldschema.table)
          .insert(rows);
      }
    }
    return entity;
  }

  /**
   * @param {Entity} entity 
   */
  async delete(entity) {
    for (const field of entity.getFields()) {
      const fieldschema = entity.schema.getField(field);
      await this.plugin.connection()(fieldschema.table)
        .where('entity', entity.schema.entity)
        .where('id', entity.id)
        .del();
    }
    return this.plugin.connection()(entity.schema.table)
      .where('id', entity.id)
      .del();
  }

}
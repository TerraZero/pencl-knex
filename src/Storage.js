const Entity = require('./Entity');
const StorageError = require('./Error/StorageError');

module.exports = class Storage {

  /**
   * @param {import('./PenclKnex')} plugin 
   */
  constructor(plugin) {
    this.plugin = plugin;
    this._entities = {};
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
   * @param {int} id 
   * @param {string[]} fields
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
    if (fields[0] === '[all]') fields = entity.getFields();
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
          entity.set(field, value, delta, null);
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
        if (ids[0] !== 0) {
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

}
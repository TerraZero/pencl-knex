const Glob = require('glob');
const Path = require('path');
const FS = require('fs');

const Schema = require('./Schema');
const Reflection = require('pencl-kit/src/Util/Reflection');
const FileUtil = require('pencl-kit/src/Util/FileUtil');
const ErrorCollector = require('pencl-kit/src/Error/ErrorCollector');
const SchemaError = require('./Error/SchemaError');

module.exports = class SchemaManager {

  /**
   * @param {import('./PenclKnex')} plugin 
   */
  constructor(plugin) {
    this.plugin = plugin;
    this._schemas = null;
    this._entitytypes = {};
    this._fieldtypes = {};
  }

  /** @returns {Object<string, Schema>} */
  get schemas() {
    if (this._schemas === null) {
      this._schemas = {};

      const files = Glob.sync(this.plugin.config.schema.pattern, {
        cwd: this.plugin.boot.getPath(this.plugin.config.schema.path),
        absolute: true,
      });
      for (const file of files) {
        const schema = new Schema(require(file));

        this._schemas[schema.name] = schema;
      }
    }
    return this._schemas;
  }

  /**
   * @param {typeof import('./FieldType/FieldTypeBase')} fieldtype 
   */
  addFieldType(fieldtype) {
    this._fieldtypes[fieldtype.type] = fieldtype;
  }

  /**
   * @param {string} type 
   * @returns {typeof import('./FieldType/FieldTypeBase')}
   */
  getFieldType(type) {
    return this._fieldtypes[type] || null;
  }

  /**
   * @param {string} field 
   * @returns {typeof import('./FieldType/FieldTypeBase')}
   */
  getTypeOfField(field) {
    const fieldschema = this.getSchema('field', field);

    return this.getFieldType(fieldschema.get('type'));
  }

  /**
   * @param {typeof import('./EntityType/EntityTypeBase')} entitytype 
   */
  addEntityType(entitytype) {
    this._entitytypes[entitytype.type] = entitytype;
  }

  /**
   * @param {string} type 
   * @returns {typeof import('./EntityType/EntityTypeBase')}
   */
  getEntityType(type) {
    return this._entitytypes[type] || null;
  }

  /**
   * @param {string} type
   * @param {string} name 
   * @returns {Schema}
   */
  getSchema(type, name) {
    return this.schemas['schema.' + type + '.' + name];
  }

  /**
   * @returns {Schema[]}
   */ 
  getEntities() {
    const entities = [];

    for (const name in this.schemas) {
      if (this.schemas[name].type === 'entity') {
        entities.push(this.schemas[name]);
      }
    }
    return entities;
  }

  /**
   * @returns {Schema[]}
   */
  getFields() {
    const fields = [];

    for (const name in this.schemas) {
      if (this.schemas[name].type === 'field') {
        fields.push(this.schemas[name]);
      }
    }
    return fields;
  }

  /**
   * @param {string} entity entity name
   * @param {string} bundle bundle name
   * @param {string} label bundle label
   * @param {Object} config bundle config
   * @param {Object<string, Object>} fields field instances config
   * @returns {import('./EntityType/EntityTypeBase')}
   */
  createEntity(entity, bundle, label, config, fields) {
    const testschema = this.getSchema('entity', entity + '.' + bundle);
    if (testschema !== undefined) {
      throw new SchemaError('The entity schema "' + entity + '.' + bundle + '" exists already.');
    }

    for (const field in fields) {
      fields[field] = Reflection.merge(this.getFieldType(this.getSchema('field', field).get('type')).defaultInstanceConfig(), fields[field]);
    }

    const schema = {
      entity,
      bundle,
      label,
      config: Reflection.merge(this.getEntityType(entity).defaultConfig(), config),
      fields,
    };
    this.createSchema('entity', schema);
    return this.getEntity(entity, bundle);
  }

  /**
   * Update an existing entity schema, with a field instance.
   * 
   * @param {Schema} entityschema 
   * @param {string} field fieldname
   * @param {Object} config 
   * @returns {import('./FieldType/FieldTypeBase')}
   */
  createEntityField(entityschema, field, config = {}) {
    config = Reflection.merge(this.getFieldType(this.getSchema('field', field).get('type')).defaultInstanceConfig(), config);
    const schema = entityschema.schema;
    schema.fields[field] = config;
    this.createSchema('entity', schema);
    return this.getField(entityschema.get('entity'), entityschema.get('bundle'), field);
  }

  /**
   * @param {string} field field name
   * @param {string} label field label
   * @param {string} type field type
   * @param {Object} config field config
   */
  createField(field, label, type, config = {}) {
    const testschema = this.getSchema('field', field);

    if (testschema !== undefined) {
      throw new SchemaError('The field schema "' + field + '" exists already.');
    }

    const collector = new ErrorCollector();
    const schema = {
      field,
      label,
      type,
      config: Reflection.mergeValid(this.getFieldType(type).defaultConfig(), (valid, object, field) => {
        collector.error('The config "' + field + '" on field type "' + type + '" is not permitted.');
      }, config),
    };

    collector.throwErrors();
    return this.createSchema('field', schema);
  }

  /**
   * @param {string} type 
   * @param {Object} schema 
   * @returns {Schema}
   */
  createSchema(type, schema) {
    const collector = new ErrorCollector();
    const s = new Schema(schema);

    collector.collect(() => {
      s.set('_type', type);
      s.set('_name', Path.parse(Reflection.replaceObject(this.plugin.config.schema.types[type], s.placeholders, '')).name);
      this.saveSchema(s);
    });

    collector.logWarnings();
    collector.throwErrors();
    return s;
  }

  /**
   * @param {Schema} schema 
   */
  saveSchema(schema) {
    if (!schema.get('_type') || !schema.get('_name')) {
      throw new Error('Schema has no required "_type" or "_name" value');
    }

    const path = Reflection.replaceObject(this.plugin.config.schema.types[schema.type], schema.placeholders, '');
    const file = Path.join(this.plugin.boot.getPath(this.plugin.config.schema.path), path);

    FileUtil.prepareDir(this.plugin.boot.root, file);
    FS.writeFileSync(file, JSON.stringify(schema.schema, null, '  '));
    this.schemas[schema.name] = schema;
  }

  /**
   * @param {Schema} schema 
   */
  deleteSchema(schema) {
    if (!schema.get('_type') || !schema.get('_name')) {
      throw new Error('Schema has no required "_type" or "_name" value');
    }

    const path = Reflection.replaceObject(this.plugin.config.schema.types[schema.type], schema.placeholders, '');
    const file = Path.join(this.plugin.boot.getPath(this.plugin.config.schema.path), path);

    FS.unlinkSync(file);
    delete this.schemas[schema.name];
  }

  /**
   * @param {string} entity 
   * @param {string} bundle 
   * @returns {import('./EntityType/EntityTypeBase')}
   */
  getEntity(entity, bundle) {
    const entityschema = this.getSchema('entity', entity + '.' + bundle);

    if (!entityschema) {
      throw new SchemaError('The entity schema "' + entity + '.' + bundle + '" does not exist');
    }
    return new (this.getEntityType(entityschema.get('entity')))(entityschema);
  }

  /**
   * @param {string} entity 
   * @param {string} bundle
   * @param {string} field 
   * @returns {import('./FieldType/FieldTypeBase')}
   */
  getField(entity, bundle, field) {
    const entityschema = this.getSchema('entity', entity + '.' + bundle);
    const fieldschema = this.getSchema('field', field);

    return new (this.getFieldType(fieldschema.get('type')))(entityschema, fieldschema);
  }

  async dbCreate(knex) {
    for (const schema of this.getEntities()) {
      const entity = this.getEntity(schema.get('entity'), schema.get('bundle'));

      await this.dbCreateEntity(knex, entity);
    }
  }

  async dbDrop(knex) {
    for (const schema of this.getEntities()) {
      const entity = this.getEntity(schema.get('entity'), schema.get('bundle'));

      await knex.schema.dropTableIfExists(entity.table);

      for (const fieldname of entity.getFields()) {
        const field = this.getField(entity.entity, entity.bundle, fieldname);

        await knex.schema.dropTableIfExists(field.table);
      }
    }
  }

  /**
   * @param {import('knex')} knex 
   * @param {import('./EntityType/EntityTypeBase')} entity 
   * @returns {Promise}
   */
  async dbCreateEntity(knex, entity) {
    const entitytype = this.getEntityType(entity.entity);

    await entitytype.dbCreate(knex, entity);

    for (const fieldname of entity.getFields()) {
      const field = this.getField(entity.entity, entity.bundle, fieldname);
      
      await this.dbCreateField(knex, field.fieldschema);
    }
  }

  /**
   * @param {import('knex')} knex 
   * @param {Schema} fieldschema 
   * @returns {Promise}
   */
  async dbCreateField(knex, fieldschema) {
    await this.getFieldType(fieldschema.get('type')).dbCreate(knex, fieldschema);
  }

}
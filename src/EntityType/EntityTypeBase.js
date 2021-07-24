const PenclGetterDefinitionError = require('pencl-kit/src/Error/Definition/PenclGetterDefinitionError');
const StringProperty = require('../PropertyType/StringProperty');

const Knex = require('../../index')();

module.exports = class EntityTypeBase {

  /** @returns {string} */
  static get type() {
    throw new PenclGetterDefinitionError(this, 'type');
  }

  /** @returns {string} */
  static get label() {
    throw new PenclGetterDefinitionError(this, 'label');
  }

  static get table() {
    return 'entity__' + this.type;
  }

  /**
   * @param {import('knex').Knex} knex 
   * @param {EntityTypeBase} entity 
   * @returns {Promise}
   */
  static dbCreate(knex, entity) {
    return this.dbTable(knex, entity);
  }

  /**
   * @param {import('knex').Knex} knex 
   * @param {EntityTypeBase} entity 
   * @returns {Promise}
   */
  static dbTable(knex, entity) {
    return knex.schema.hasTable(entity.table).then((exists) => {
      if (!exists) {
        return knex.schema.createTable(entity.table, (table) => {
          table.string('entity');
          table.string('bundle');
          table.increments('id');

          this.dbProperties(table, entity);
        });
      }
    });
  }

  /**
   * @param {import('knex').Knex.TableBuilder} table 
   * @param {EntityTypeBase} entity 
   */
  static dbProperties(table, entity) {
    for (const prop in entity.props) {
      entity.props[prop].dbCreateField(table);
    }
  }

  /**
   * @param {import('../Entity')} entity
   * @returns {Object}
   */
  static dbRow(entity) {
    const row = {
      entity: entity.data.entity,
      bundle: entity.data.bundle,
      id: entity.data.id,
    };

    this.dbRowProperties(entity, row);
    return row;
  }

  /**
   * @param {import('../Entity')} entity
   * @param {Object} row
   * @returns {Object}
   */
  static dbRowProperties(entity, row) {
    for (const prop in entity.schema.props) {
      if (prop === 'label') {
        row[entity.schema.props[prop].dbField] = entity.data[prop] || (entity.data.label = entity.data.bundle + ' [' + entity.data.id + ']');
      } else {
        row[entity.schema.props[prop].dbField] = entity.data[prop] || null;
      }
    }
    return row;
  }

  /**
   * @param {import('../Entity')} entity
   * @param {Object} row
   * @returns {import('../Entity')}
   */
  static dbRowLoad(entity, row) {
    for (const prop in entity.schema.props) {
      entity.data[prop] = row[entity.schema.props[prop].dbField] || null;
    }
    return entity;
  }

  static defaultConfig() {
    return {};
  }

  /**
   * @param {EntityTypeBase} entity
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(entity, props) {
    props.label = StringProperty.create('label').length(1024);
  }

  /**
   * @param {Object} form 
   * @param {Object} config
   */
  static formSchemaBundle(form, config) {
    form.bundle = {
      type: 'string',
      label: 'Bundle Key',
      mask: [
        {
          regex: '([^a-z]+)',
          replace: '_',
        }
      ],
      requireInit: true,
    };
    form.label = {
      type: 'string',
      label: 'Bundle Label',
    };
  }

  /**
   * @param {EntityTypeBase} entity
   * @param {Object} form 
   * @param {Object} config
   */
  static formSchemaFields(entity, form, config) {
    for (const field of entity.getFields()) {
      const fieldtype = entity.getField(field);
      form[field] = {
        type: 'group',
        label: fieldtype.label,
        mount: 'fields.' + field,
        form: {},
      };
      fieldtype.definition.formSchemaField(form[field].form, config);
    }
  }

  /**
   * @param {EntityTypeBase} entity
   * @param {Object} form 
   * @param {Object} config
   */
  static formInstanceFields(entity, form, config) {
    for (const field of entity.getFields()) {
      const fieldtype = entity.getField(field);
      form[field] = {
        type: 'group',
        label: fieldtype.fieldschema.get('label'),
        mount: 'fields.' + field,
        form: {},
      };
      fieldtype.definition.formInstanceField(form[field].form, config);
    }
  }

  /**
   * @param {import('../Schema')} entity entity schema
   */
  constructor(entity) {
    this._entity = entity;
  }

  /** @returns {typeof EntityTypeBase} */
  get definition() {
    return this.constructor;
  }

  /** @returns {string} */
  get table() {
    return this.definition.table;
  }

  /** @returns {import('../Schema')} */
  get entityschema() {
    return this._entity;
  }

  get entity() {
    return this.entityschema.get('entity');
  }

  get label() {
    return this.definition.label;
  }

  get bundle() {
    return this.entityschema.get('bundle');
  }

  get bundlelabel() {
    return this.entityschema.get('label');
  }

  get config() {
    return this.entityschema.get('config');
  }

  get fields() {
    return this.entityschema.get('fields');
  }

  /**
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  get props() {
    if (this._props === undefined) {
      this._props = {};
      this.definition.properties(this, this._props);
    }
    return this._props;
  }

  /**
   * @returns {string[]}
   */
  getFields() {
    const fields = [];

    for (const field in this.fields) {
      fields.push(field);
    }
    return fields;
  }

  /**
   * @param {string} field 
   * @returns {import('../FieldType/FieldTypeBase')}
   */
  getField(field) {
    return Knex.schemas.getField(this.entity, this.bundle, field);
  }

  /**
   * @param {string} field 
   * @returns {boolean}
   */
  hasField(field) {
    return this.entityschema.get('fields.' + field, null) !== null;
  }

}
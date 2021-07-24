const FieldError = require('../Error/FieldError');
const PenclMethodDefinitionError = require('pencl-kit/src/Error/Definition/PenclMethodDefinitionError');
const PenclGetterDefinitionError = require('pencl-kit/src/Error/Definition/PenclGetterDefinitionError');

module.exports = class FieldTypeBase {

  static get DEFAULT_PROPERTY() { return '[DEFAULT]'; }

  /** @returns {string} */
  static get type() {
    throw new PenclGetterDefinitionError(this, 'type');
  }

  /**
   * @param {import('../Schema')} fieldschema 
   * @returns {string}
   */
  static dbTableName(fieldschema) {
    return 'field__' + fieldschema.get('field');
  }

  /**
   * @param {import('knex').Knex} knex 
   * @param {import('../Schema')} fieldschema 
   * @returns {Promise}
   */
  static dbCreate(knex, fieldschema) {
    return this.dbCreateTable(knex, fieldschema);
  }

  /**
   * @param {import('knex').Knex} knex 
   * @param {import('../Schema')} fieldschema 
   * @returns {Promise}
   */
  static dbCreateTable(knex, fieldschema) {
    return knex.schema.hasTable(this.dbTableName(fieldschema)).then((exists) => {
      if (!exists) {
        return knex.schema.createTable(this.dbTableName(fieldschema), (table) => {
          table.string('entity');
          table.string('id');
          table.integer('delta');

          this.dbCreateProperties(table, fieldschema);
        });
      }
    });
  }

  /**
   * @param {import('knex').Knex.TableBuilder} table 
   * @param {import('../Schema')} fieldschema 
   */
  static dbCreateProperties(table, fieldschema) {
    const props = {};
    this.properties(fieldschema, props);
    for (const prop in props) {
      props[prop].dbCreateField(table);
    }
  }

  /**
   * @param {import('../Entity')} entity
   * @param {FieldTypeBase} field
   * @returns {Object[]}
   */
  static dbRow(entity, field) {
    const rows = [];
    const values = entity.data.fields[field.field];
    for (const delta in values) {
      const row = {
        entity: entity.data.entity,
        id: entity.data.id,
        delta: delta,
      };
      this.dbRowProperties(entity, field, values[delta], delta, row);
      rows.push(row);
    }
    return rows;
  }

  /**
   * @param {import('../Entity')} entity
   * @param {FieldTypeBase} field
   * @param {*} value
   * @param {number} delta
   * @param {Object} row
   * @returns {Object}
   */
  static dbRowProperties(entity, field, value, delta, row) {
    for (const prop in field.props) {
      row[field.props[prop].dbField] = value[prop];
    }
    return row;
  }

  /**
   * @param {import('../Entity')} entity
   * @param {FieldTypeBase} field
   * @param {*} value
   * @param {number} delta
   * @param {Object} row
   * @returns {Object}
   */
  static dbRowLoad(entity, field, value, delta, row) {
    for (const prop in field.props) {
      value[prop] = row[field.props[prop].dbField] || null;
    }
    return value;
  }

  /**
   * @param {import('../Schema')} fieldschema
   * @param {Object<string, import('../PropertyType/PropertyBase')>} props
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  static properties(fieldschema, props) {
    throw new PenclMethodDefinitionError(this, 'properties');
  }

  static get defaultProperty() {
    return 'value';
  }

  static defaultConfig() {
    return {};
  }

  static defaultInstanceConfig() {
    return {
      cardinality: 1,
    };
  }

  /**
   * @param {FieldTypeBase} field 
   * @param {string} property
   * @param {*} value
   * @returns {*}
   */
  static validate(field, property, value) {
    return field.props[property].validate(value);
  }

  /**
   * @param {Object} form 
   * @param {Object} config
   */
  static formSchemaField(form, config) {
    form.key = {
      type: 'string',
      label: 'Field Key',
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
      label: 'Field Label',
    };
  }

  /**
   * @param {Object} form 
   * @param {Object} config
   */
  static formInstanceField(form, config) {
    form.label = {
      type: 'string',
      label: 'Field Label (Override)',
      fallback: null,
    };
    form.cardinality = {
      type: 'number',
      label: 'Cardinality',
      description: 'Enter 0 for unlimit values.',
    };
  }

  /**
   * @param {import('../Schema')} entity entity schema
   * @param {import('../Schema')} field field schema
   */
  constructor(entity, field) {
    this._entity = entity;
    this._field = field;
  }

  /** @returns {typeof FieldTypeBase} */
  get definition() {
    return this.constructor;
  }

  /** @returns {string} */
  get table() {
    return this.definition.dbTableName(this.fieldschema);
  }

  /** @returns {import('../Schema')} */
  get entityschema() {
    return this._entity;
  }

  /** @returns {import('../Schema')} */
  get fieldschema() {
    return this._field;
  }

  get entity() {
    return this.entityschema.get('entity');
  }

  get bundle() {
    return this.entityschema.get('bundle');
  }

  get field() {
    return this.fieldschema.get('field');
  }

  get label() {
    return this.config.label || this.fieldschema.get('label');
  }

  get config() {
    return this.entityschema.get('fields.' + this.field);
  }

  get fieldconfig() {
    return this.fieldschema.get('config');
  }

  get type() {
    return this.fieldschema.get('type');
  }

  /**
   * @returns {Object<string, import('../PropertyType/PropertyBase')>}
   */
  get props() {
    if (this._props === undefined) {
      this._props = {};
      this.definition.properties(this.fieldschema, this._props);
    }
    return this._props;
  }

  get(value, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (property === FieldTypeBase.DEFAULT_PROPERTY) property = this.definition.defaultProperty;

    if (property === null) {
      return value;
    } else if (this.props[property] === undefined) {
      throw new FieldError('No property found with name "' + property + '" in field.', this, value);
    }

    return value[property] || null;
  }

  set(value, data, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (property === FieldTypeBase.DEFAULT_PROPERTY) property = this.definition.defaultProperty;

    if (property === null) {
      for (const prop in this.props) {
        this.set(value, data[prop], prop);
      }
    } else if (this.props[property] === undefined) {
      throw new FieldError('No property found with name "' + property + '" in field.', this, value);
    } else {
      value[property] = this.props[property].transform(this.definition.validate(this, property, data));
    }
    return value;
  }

}
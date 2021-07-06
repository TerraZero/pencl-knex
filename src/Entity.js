const EntityError = require('./Error/EntityError');
const FieldTypeBase = require('./FieldType/FieldTypeBase');

/**
 * @typedef {Object} T_entitydata
 * @property {int} [id]
 * @property {string} [label]
 * @property {Object<string, Object>} [fields]
 */

module.exports = class Entity {

  /**
   * @param {import('./PenclKnex')} plugin
   * @param {import('./EntityType/EntityTypeBase')} schema 
   * @param {T_entitydata} data 
   */
  constructor(plugin, schema, data = {}) {
    this.plugin = plugin;
    this.schema = schema;
    this.data = data;
    this.data.entity = this.schema.entity;
    this.data.bundle = this.schema.bundle;
    this.data.id = this.data.id || null;

    this.schema.definition.dbRowLoad(this, data);

    this.data.fields = this.data.fields || {};

    this._loadedFields = [];
    if (!this.isNew()) {
      for (const field in this.data.fields) {
        this._loadedFields.push(field);
      } 
    }
  }

  /**
   * @param {T_entitydata} data 
   * @returns {this}
   */
  setData(data) {
    if (data === null) return this;
    for (const property in data) {
      if (Array.isArray(data[property])) {
        this.sets(property, data[property], (typeof data[property] === 'object' ? null : FieldTypeBase.DEFAULT_PROPERTY));
      } else {
        this.set(property, data[property], (typeof data[property] === 'object' ? null : FieldTypeBase.DEFAULT_PROPERTY));
      }
    }
    return this;
  }

  get id() {
    return this.data.id;
  }

  isNew() {
    return this.id === null;
  }

  isLoaded(field) {
    return this._loadedFields.includes(field);
  }

  setLoaded(field) {
    if (this.isLoaded(field)) return this;
    this._loadedFields.push(field);
    this.data.fields[field] = [];
    return this;
  }

  /**
   * @param  {...string} fields 
   * @returns {this}
   */
  async load(...fields) {
    return await this.plugin.storage.loadFields(this, ...fields);
  }

  /**
   * @returns {this}
   */
  async save() {
    return await this.plugin.storage.save(this);
  }

  /**
   * @param {string} field 
   * @returns {boolean}
   */
  hasField(field) {
    return this.schema.hasField(field);
  }

  /**
   * @param {string} field 
   * @param {*} value
   * @param {int} delta
   * @param {string} property
   * @returns {this}
   */
  set(field, value, delta = 0, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (typeof value === 'object' && !Array.isArray(value) && property === FieldTypeBase.DEFAULT_PROPERTY) {
      property = null;
    }
    if (this.schema.hasField(field)) {
      this.setLoaded(field);

      const fieldtype = this.schema.getField(field);
      
      if (fieldtype.config.cardinality !== 0 && delta >= fieldtype.config.cardinality) return this;

      if (this.data.fields[field][delta] === undefined) {
        this.data.fields[field].push(fieldtype.set({}, value, property));
      } else {
        this.data.fields[field][delta] = fieldtype.set(this.data.fields[field][delta], value, property);
      }
    } else {
      if (['entity', 'bundle'].includes(field)) {
        throw new EntityError('Property "' + field + '" is read only.', this);
      } else if (field === 'id') {
        this.data[field] = value;
      } else if (this.schema.props[field] !== undefined) {
        this.schema.props[field].validate(value);
        this.data[field] = this.schema.props[field].transform(value);
      } else {
        throw new EntityError('No field or property found with name "' + field + '" in entity.', this);
      }
    }
    return this;
  }

  sets(field, values, property = FieldTypeBase.DEFAULT_PROPERTY) {
    this.setLoaded(field);
    this.data.fields[field] = [];

    if (values === null) return this;
    for (const delta in values) {
      this.set(field, values[delta], delta, property);
    }
    return this;
  }

  get(field, delta = 0, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (this.schema.hasField(field)) {
      if (this.isLoaded(field)) {
        if (this.data.fields[field][delta] === null || this.data.fields[field][delta] === undefined) {
          return null;
        }
        return this.schema.getField(field).get(this.data.fields[field][delta], property);
      } else {
        throw new Error('Field "' + field + '" is not loaded.');
      }
    }
    return this.data[field];
  }

  gets(field, property = FieldTypeBase.DEFAULT_PROPERTY) {
    if (this.schema.hasField(field)) {
      if (this.isLoaded(field)) {
        const values = [];
        for (const delta in this.data.fields[field]) {
          values.push(this.get(field, delta, property));
        }
        return values;
      } else {
        throw new Error('Field "' + field + '" is not loaded.');
      }
    }
    return this.data[field];
  }

}
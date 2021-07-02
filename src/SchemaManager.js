const Glob = require('glob');
const Path = require('path');
const FS = require('fs');

const Schema = require('./Schema');
const Reflection = require('pencl-kit/src/Util/Reflection');
const Regex = require('pencl-kit/src/Util/Regex');
const FileUtil = require('pencl-kit/src/Util/FileUtil');

module.exports = class SchemaManager {

  /**
   * @param {import('./PenclKnex')} plugin 
   */
  constructor(plugin) {
    this.plugin = plugin;
    this._schemas = null;
  }

  /** @returns {Schema[]} */
  get schemas() {
    if (this._schemas === null) {
      this._schemas = {};

      const files = Glob.sync(this.plugin.config.schemapattern, {
        cwd: this.plugin.boot.getPath(this.plugin.config.schema), 
        absolute: true,
      });
      for (const file of files) {
        const schema = new Schema(file, Path.basename(file), require(file));

        this._schemas[schema.name] = schema;
      }
    }
    return this._schemas;
  }

  createEntity(entity, bundle, config, fields) {
    const schema = {
      entity,
      bundle,
      config,
      fields,
    };

    this.createSchema('entity', schema);
  }

  createField(field, type, config) {
    const schema = {
      field,
      type,
      config,
    };

    this.createSchema('field', schema);
  }

  createSchema(type, schema) {
    const placeholders = {};
    for (const field in schema) {
      if (typeof schema[field] !== 'object') {
        placeholders[Regex.escape('[' + field + ']')] = schema[field];
      }
    }


    const name = Reflection.replaceObject(this.plugin.config.schemas[type], placeholders);
    const file = Path.join(this.plugin.boot.getPath(this.plugin.config.schema), name);

    FileUtil.prepareDir(this.plugin.boot.root, file);
    FS.writeFileSync(file, JSON.stringify(schema));
  }

}
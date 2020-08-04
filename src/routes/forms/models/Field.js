// const Base = require("$base");
const { Model } = require("objection");
class Field extends Model {
  static get tableName() {
    return "fields";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },

        value: { type: "string" },
        type: { type: "string" },
        optional: { type: "boolean" },
      },
    };
  }

  static get relationMappings() {
    const FieldOptions = require("$models/FieldOptions");
    const FormFields = require("$models/FormFields");
    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: FormFields,
        join: {
          from: "fields.id",
          to: "form_fields.field_id",
        },
      },
      // options: {
      //   relation: Model.HasManyRelation,
      //   modelClass: FieldOptions,
      //   join: {
      //     from: "fields.id",
      //     to: "form_field_children.field_parent_id",
      //   },
      // },
    };
  }
}

module.exports = Field;

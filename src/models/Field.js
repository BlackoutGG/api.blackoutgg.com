const { Model } = require("objection");
class Field extends Model {
  static get tableName() {
    return "fields";
  }

  static get modifiers() {
    const { ref } = Field;
    return {
      order(builder) {
        builder.orderBy(ref("order"), "asc");
      },
    };
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
    const FormFields = require("$models/FormFields");
    const Form = require("$models/Form");
    return {
      // form: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: Form,
      //   join: {
      //     from: "fields.id",
      //     through: {
      //       from: "form_fields.field_id",
      //       to: "form_fields.form_id",
      //     },
      //     to: "forms.id",
      //   },
      // },
      // form: {
      //   relation: Model.HasOneRelation,
      //   modelClass: FormFields,
      //   join: {
      //     from: "fields.id",
      //     to: "form_fields.field_id",
      //   },
      // },
    };
  }
}

module.exports = Field;

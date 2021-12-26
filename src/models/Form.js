"use strict";
const dateMixin = require("$util/mixins/date")();
const cursor = require("objection-cursor")({
  // nodes: true,
  pageInfo: {
    hasMore: true,
  },
});
const { Model } = require("objection");

class Form extends cursor(dateMixin(Model)) {
  static get tableName() {
    return "forms";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        creator_id: { type: "integer" },
        category_id: { type: "integer" },
        name: { type: "string " },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Field = require("$models/Field");
    const FormCategory = require("$models/FormCategory");
    const Category = require("$models/Category");
    const User = require("$models/User");
    return {
      created_by: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "forms.creator_id",
          to: "users.id",
        },
      },
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: "forms.category_id",
          to: "categories.id",
        },
      },
      form_category: {
        relation: Model.HasOneRelation,
        modelClass: FormCategory,
        join: {
          from: "forms.id",
          to: "form_category.form_id",
        },
      },
      fields: {
        relation: Model.ManyToManyRelation,
        modelClass: Field,
        join: {
          from: "forms.id",
          through: {
            from: "form_fields.form_id",
            to: "form_fields.field_id",
          },
          to: "fields.id",
        },
      },
    };
  }
}

module.exports = Form;

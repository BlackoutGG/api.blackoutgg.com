"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();
const cursor = require("objection-cursor")({
  pageInfo: {
    hasMore: true,
  },
});

class Tag extends cursor(dateMixin(Model)) {
  static get tableName() {
    return "tags";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name"],
      properties: {
        id: { type: "integer" },
        // id: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
        is_deletable: { type: "boolean" },
      },
    };
  }

  // static get relationMappings() {

  //   return {

  //     forms: {
  //       relation: Model.HasOneRelation,
  //       modelClass: Form,
  //       join: {
  //         from: "categories.id",
  //         to: "forms.category_id",
  //       },
  //     },
  //   };
  // }
}

module.exports = Tag;

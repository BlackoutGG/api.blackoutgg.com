"use strict";
const { Model } = require("objection");

class UserRole extends Model {
  static get tableName() {
    return "user_roles";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "role_id"],
      properties: {
        user_id: { type: "integer" },
        role_id: { type: "integer" },
      },
    };
  }

  // static get relationMappings() {
  //   const Role = require("$models/Roles");
  //   const User = require("$models/User");
  //   return {
  //     role: {
  //       relation: Model.HasOneRelation,
  //       modelClass: Role,
  //       join: {
  //         from: "user_roles.role_id",
  //         to: "roles.id",
  //       },
  //     },
  //     user: {
  //       relation: Model.HasOneRelation,
  //       modelClass: User,
  //       join: {
  //         from: "user_roles.user_id",
  //         to: "users.id",
  //       },
  //     },
  //   };
  // }
}

module.exports = UserRole;

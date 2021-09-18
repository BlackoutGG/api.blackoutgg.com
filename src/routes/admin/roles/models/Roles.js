"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();

class Role extends dateMixin(Model) {
  static get tableName() {
    return "roles";
  }

  static get modifiers() {
    return {
      nameAndId(builder) {
        builder.select("id", "name");
      },
      distinctOnRole(builder) {
        builder.distinctOn("id");
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        level: { type: "integer" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Users = require("$models/User");
    const Policies = require("$models/Policies");
    const DiscordRole = require("$models/DiscordRole");
    return {
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: Users,
        join: {
          from: "roles.id",
          through: {
            from: "user_roles.role_id",
            to: "user_roles.user_id",
          },
          to: "users.id",
        },
      },

      discord_roles: {
        relation: Model.ManyToManyRelation,
        modelClass: DiscordRole,
        join: {
          from: "roles.id",
          through: {
            from: "role_maps.role_id",
            to: "role_maps.native_discord_role_id",
          },
          to: "discord_roles.id",
        },
      },

      policies: {
        relation: Model.ManyToManyRelation,
        modelClass: Policies,
        join: {
          from: "roles.id",
          through: {
            from: "role_policies.role_id",
            to: "role_policies.policy_id",
          },
          to: "policies.id",
        },
      },
    };
  }
}

module.exports = Role;

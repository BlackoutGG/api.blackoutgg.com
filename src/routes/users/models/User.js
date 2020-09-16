"use strict";
const Base = require("$base");
const { Role } = require("discord.js");
const { ref } = require("./UserRole");

class User extends Base {
  static get tableName() {
    return "users";
  }

  static get modifiers() {
    return {
      defaultSelects(builder) {
        builder.select("id", "username", "avatar");
      },
    };
  }

  getScope() {
    const roles = this.roles.reduce((result, perm) => {
      for (let key in perm) {
        if (!perm.hasOwnProperty(key)) continue;
        if (perm[key] && typeof perm[key] === "boolean") {
          result[key] = perm[key];
        }
      }
      return result;
    }, {});

    const scope = Object.entries(roles).reduce((arr, [key, val]) => {
      if (typeof val !== "boolean") return;

      if (/^can_/.test(key)) {
        let args = key.split("_"),
          perms,
          type;

        if (val) {
          if (args.length > 2) {
            perms = args[1];
            type = args[2];
          } else {
            perms = args[0];
            type = args[1];
          }

          arr.push(`${type}:${perms}`);
        }
      }

      return arr;
    }, []);

    return scope;
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["username", "password"],
      properties: {
        id: { type: "integer" },
        discord_id: { type: "integer" },
        username: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        avatar: { type: "string" },
        is_disabled: { type: "boolean" },
      },
    };
  }

  static get relationMappings() {
    const Roles = require("$models/Roles");
    const UserRole = require("./UserRole");
    return {
      user_roles: {
        relation: Base.HasManyRelation,
        modelClass: UserRole,
        join: {
          from: "users.id",
          to: "user_roles.user_id",
        },
      },
      roles: {
        relation: Base.ManyToManyRelation,
        modelClass: Roles,
        join: {
          from: "users.id",
          through: {
            from: "user_roles.user_id",
            to: "user_roles.role_id",
          },
          to: "roles.id",
        },
      },
    };
  }
}

module.exports = User;

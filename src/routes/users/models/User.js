"use strict";
const Base = require("$base");

class User extends Base {
  static get tableName() {
    return "users";
  }

  getRoles() {
    return this.roles.map((role) => ({ id: role.id, name: role.name }));
  }

  getScope() {
    return this.roles.reduce((result, perm) => {
      result = Object.entries(perm)
        .filter(
          ([key, value]) =>
            typeof value === "boolean" && value && /^can_/.test(key)
        )
        .map(([key, val]) => {
          if (/^can_/.test(key)) {
            let scope = key.split("_"),
              prefix,
              priv;

            if (val) {
              if (scope.length > 2) {
                prefix = scope[2];
                priv = scope[1];
              } else {
                prefix = scope[1];
                priv = scope[0];
              }
            }

            return `${prefix}:${priv}`;
          }
        });

      return result;
    }, []);
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
    return {
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

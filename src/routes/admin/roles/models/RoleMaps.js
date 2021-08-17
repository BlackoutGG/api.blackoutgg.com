const { Model } = require("objection");

class RoleMap extends Model {
  static get tableName() {
    return "role_map";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: ["role_id", "discord_role_id"],
      properties: {
        role_id: { type: "integer" },
        discord_role_id: { type: "integer" },
      },
    };
  }
}

module.exports = RoleMap;

const { Model } = require("objection");

class DiscordRole extends Model {
  static get tableName() {
    return "discord_roles";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: ["name", "discord_role_id"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        discord_role_id: { type: "string" },
      },
    };
  }
}

module.exports = DiscordRole;

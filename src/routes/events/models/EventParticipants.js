const { Model } = require("objection");

class EventParticipants extends Model {
  static get tableName() {
    return "event_participants";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        event_id: { type: "integer" },
        user_id: { type: "integer" },
      },
    };
  }
}

module.exports = EventParticipants;

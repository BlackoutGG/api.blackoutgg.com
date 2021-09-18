const { Model } = require("objection");

class Settings extends Model {
  static get tableName() {
    return "settings";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        show_history_carousel_on_frontpage: { type: "boolean" },
        show_video: { type: "boolean" },
        show_video_on_mobile: { type: "boolean" },
        show_testimonies: { type: "boolean" },
        show_recruitment_button: { type: "boolean" },
        enable_social_authentication: { type: "boolean" },
        password_reset_request_ttl_in_minutes: { type: "integer" },
        password_reset_resend_timer_in_minutes: { type: "integer" },
        user_activation_request_ttl_in_minutes: { type: "integer" },
        user_activation_resend_timer_in_minutes: { type: "integer" },
        front_page_video_url: { type: "string" },
      },
    };
  }
}

module.exports = Settings;
